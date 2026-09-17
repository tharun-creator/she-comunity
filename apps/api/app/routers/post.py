from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from uuid import UUID
from app.schemas.post import PostCreate, PostResponse, PostListResponse, PostListParams
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client
from app.middleware.ratelimit import check_write_rate_limit

router = APIRouter()


@router.get("/pgs/{pg_id}/posts", response_model=PostListResponse)
async def list_posts(
    pg_id: UUID,
    sort: str = Query("new", pattern="^(new|top|discussed)$"),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user)
):
    """List posts for a PG with cursor pagination and sort."""
    supabase = get_supabase_client()

    # Check PG visibility
    pg_result = supabase.from_("pgs").select("id, member_count, review_count").eq("id", str(pg_id)).single()
    if pg_result.error or not pg_result.data:
        raise HTTPException(status_code=404, detail="PG not found")

    pg = pg_result.data
    membership = supabase.from_("pg_memberships").select("id").eq("pg_id", str(pg_id)).eq("user_id", current_user.user_id).single()
    is_member = membership.data is not None
    is_public = (pg.get("member_count", 0) >= 3) or (pg.get("review_count", 0) >= 5)

    if not is_member and not is_public:
        raise HTTPException(status_code=404, detail="PG not found")

    query = supabase.from_("posts_public").select("*").eq("pg_id", str(pg_id)).limit(limit)

    if sort == "top":
        query = query.order("upvotes", ascending=False)
    elif sort == "discussed":
        query = query.order("comment_count", ascending=False)
    else:
        query = query.order("created_at", ascending=False)

    if cursor:
        query = query.lt("created_at", cursor)

    result = query.execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    return PostListResponse(data=result.data, next_cursor=None, has_more=len(result.data) == limit)


@router.post("/pgs/{pg_id}/posts", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    pg_id: UUID,
    post_data: PostCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Create a new post in a PG (requires membership)."""
    supabase = get_supabase_client()

    # Check PG exists and user is member
    membership = supabase.from_("pg_memberships").select("id").eq("pg_id", str(pg_id)).eq("user_id", current_user.user_id).single()
    if not membership.data:
        raise HTTPException(status_code=403, detail="Must be a member to post")

    # Check rate limit
    await check_write_rate_limit(current_user.user_id, "post")

    # Get author display name for non-anonymous posts
    author_info = {"is_anonymous": post_data.is_anonymous}
    if not post_data.is_anonymous:
        user_result = supabase.from_("users").select("display_name, avatar_url").eq("auth_user_id", current_user.user_id).single()
        if user_result.data:
            author_info = {
                "is_anonymous": False,
                "display_name": user_result.data.get("display_name"),
                "avatar_url": user_result.data.get("avatar_url"),
            }
        else:
            author_info = {"is_anonymous": True, "anonymous_tag": "Anonymous Resident"}

    # Insert post
    insert_data = {
        "pg_id": str(pg_id),
        "author_id": current_user.user_id,
        "is_anonymous": post_data.is_anonymous,
        "type": post_data.type,
        "title": post_data.title,
        "body": post_data.body,
        "residency_claim": post_data.residency_claim,
        "rating_tags": post_data.rating_tags,
        "overall_rating": post_data.overall_rating,
        "poll_options": [{"id": f"opt-{i}", "label": o.label, "vote_count": 0} for i, o in enumerate(post_data.poll_options)] if post_data.poll_options else None,
        "image_url": post_data.image_url,
        "link_url": post_data.link_url,
        "topics": post_data.topics,
    }

    result = supabase.from_("posts").insert(insert_data).select().single()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    post = result.data
    post["author"] = author_info
    post["my_vote"] = 0
    post["upvotes"] = 0
    post["downvotes"] = 0
    post["comment_count"] = 0
    post["my_poll_vote"] = None
    post["is_saved"] = False

    return PostResponse(**post)


@router.get("/posts/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: UUID,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Get post detail with author info."""
    supabase = get_supabase_client()

    result = supabase.from_("posts_public").select("*").eq("id", str(post_id)).single()

    if result.error or not result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    post = result.data

    # Check PG visibility
    pg_result = supabase.from_("pgs").select("id, member_count, review_count").eq("id", post["pg_id"]).single()
    if pg_result.error or not pg_result.data:
        raise HTTPException(status_code=404, detail="PG not found")

    pg = pg_result.data
    membership = supabase.from_("pg_memberships").select("id").eq("pg_id", post["pg_id"]).eq("user_id", current_user.user_id).single()
    is_member = membership.data is not None
    is_public = (pg.get("member_count", 0) >= 3) or (pg.get("review_count", 0) >= 5)

    if not is_member and not is_public:
        raise HTTPException(status_code=404, detail="Post not found")

    return PostResponse(**post)