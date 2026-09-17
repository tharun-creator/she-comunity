from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from uuid import UUID
from app.schemas.pg import PGCreate, PGResponse, PGListResponse
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client
from app.middleware.ratelimit import check_write_rate_limit

router = APIRouter()


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

    query = supabase.from_("pgs").select("*, pg_stats!inner(member_count, review_count, aggregate_rating)")

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

    return PGListResponse(data=result.data, next_cursor=None, has_more=len(result.data) == limit)


@router.get("/pgs/search", response_model=PGListResponse)
async def search_pgs(
    q: str = Query(..., min_length=1),
    area: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    current_user: CurrentUser = Depends(get_current_user)
):
    """Search PGs using full-text search (Postgres FTS)."""
    supabase = get_supabase_client()

    query = supabase.from_("pgs").select("*, pg_stats!inner(member_count, review_count, aggregate_rating)")

    # Use Postgres full-text search on search_tsv column
    query = query.text_search("search_tsv", q, config="english")

    if area and area != "All":
        query = query.eq("area", area)

    query = query.order("created_at", ascending=False).limit(limit)

    result = query.execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    return PGListResponse(data=result.data, next_cursor=None, has_more=len(result.data) == limit)


@router.get("/pgs/{pg_id}", response_model=PGResponse)
async def get_pg(
    pg_id: UUID,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get PG by ID with visibility check."""
    supabase = get_supabase_client()

    result = supabase.from_("pgs").select("*, pg_stats!inner(member_count, review_count, aggregate_rating)").eq("id", str(pg_id)).single()

    if result.error or not result.data:
        raise HTTPException(status_code=404, detail="PG not found")

    pg = result.data

    # Check visibility
    membership = supabase.from_("pg_memberships").select("id").eq("pg_id", str(pg_id)).eq("user_id", current_user.user_id).single()
    is_member = membership.data is not None
    is_public = (pg.get("member_count", 0) >= 3) or (pg.get("review_count", 0) >= 5)

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

    return PGResponse(**pg)