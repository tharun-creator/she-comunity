from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from uuid import UUID
from app.schemas.pg import PGCreate, PGResponse, PGListResponse
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client
from app.middleware.ratelimit import check_write_rate_limit
from app.schemas.common import build_cursor_response

router = APIRouter()


def format_pg_dict(pg_dict: dict) -> dict:
    """Flatten pg_stats and calculate is_publicly_visible."""
    pg_data = dict(pg_dict)
    stats = pg_data.pop("pg_stats", None)
    if isinstance(stats, list) and stats:
        stats = stats[0]
    elif not isinstance(stats, dict):
        stats = {}

    member_count = stats.get("member_count", pg_data.get("member_count", 0))
    review_count = stats.get("review_count", pg_data.get("review_count", 0))
    aggregate_rating = stats.get("aggregate_rating", pg_data.get("aggregate_rating", None))

    pg_data["member_count"] = member_count
    pg_data["review_count"] = review_count
    pg_data["aggregate_rating"] = aggregate_rating
    pg_data["tag_averages"] = stats.get("tag_averages", pg_data.get("tag_averages", {}))
    pg_data["is_publicly_visible"] = (member_count >= 3) or (review_count >= 5)
    return pg_data


@router.get("/pgs", response_model=PGListResponse)
async def list_pgs(
    search: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user)
):
    """List PGs with visibility filter, search, and cursor pagination."""
    supabase = get_supabase_client()

    query = supabase.from_("pgs").select("*, pg_stats(member_count, review_count, aggregate_rating)")

    if search:
        query = query.or_(f"name.ilike.%{search}%,area.ilike.%{search}%")

    if area and area != "All":
        query = query.eq("area", area)

    query = query.order("created_at", ascending=False).limit(limit)

    if cursor:
        query = query.lt("created_at", cursor)

    result = query.execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    formatted_data = [format_pg_dict(p) for p in (result.data or [])]
    next_cursor, has_more = build_cursor_response(formatted_data, limit, "created_at")
    return PGListResponse(data=formatted_data, next_cursor=next_cursor, has_more=has_more)


@router.get("/pgs/search", response_model=PGListResponse)
async def search_pgs(
    q: str = Query(..., min_length=1),
    area: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Search PGs using full-text search (Postgres FTS)."""
    supabase = get_supabase_client()

    query = supabase.from_("pgs").select("*, pg_stats(member_count, review_count, aggregate_rating)")

    # Use Postgres full-text search on search_tsv column
    query = query.text_search("search_tsv", q, config="english")

    if area and area != "All":
        query = query.eq("area", area)

    query = query.order("created_at", ascending=False).limit(limit)

    if cursor:
        query = query.lt("created_at", cursor)

    result = query.execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    formatted_data = [format_pg_dict(p) for p in (result.data or [])]
    next_cursor, has_more = build_cursor_response(formatted_data, limit, "created_at")
    return PGListResponse(data=formatted_data, next_cursor=next_cursor, has_more=has_more)


@router.get("/pgs/{pg_id}", response_model=PGResponse)
async def get_pg(
    pg_id: UUID,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get PG by ID with visibility check."""
    supabase = get_supabase_client()

    result = supabase.from_("pgs").select("*, pg_stats(member_count, review_count, aggregate_rating)").eq("id", str(pg_id)).single()

    if result.error or not result.data:
        raise HTTPException(status_code=404, detail="PG not found")

    pg = format_pg_dict(result.data)

    # Check visibility
    membership = supabase.from_("pg_memberships").select("pg_id").eq("pg_id", str(pg_id)).eq("user_id", current_user.user_id).execute()
    is_member = bool(membership.data)
    is_public = pg["is_publicly_visible"]

    if not is_member and not is_public:
        raise HTTPException(status_code=404, detail="PG not found")

    return PGResponse(**pg)


@router.post("/pgs", response_model=PGResponse, status_code=status.HTTP_201_CREATED)
async def create_pg(
    pg_data: PGCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Create a new PG (user becomes founding member)."""
    supabase = get_supabase_client()

    # Check rate limit
    await check_write_rate_limit(current_user.user_id, "post")

    result = supabase.from_("pgs").insert({
        "name": pg_data.name,
        "area": pg_data.area,
        "address": pg_data.address,
        "founding_user_id": current_user.user_id,
    }).select().single()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    pg = result.data

    # Create membership for founder
    membership_result = supabase.from_("pg_memberships").insert({
        "pg_id": pg["id"],
        "user_id": current_user.user_id,
    }).execute()

    if membership_result.error:
        # Rollback PG creation
        supabase.from_("pgs").delete().eq("id", pg["id"]).execute()
        raise HTTPException(status_code=400, detail="Failed to create membership")

    pg["member_count"] = 1
    pg["review_count"] = 0
    pg["aggregate_rating"] = None
    pg["tag_averages"] = {}
    pg["is_publicly_visible"] = False

    return PGResponse(**pg)