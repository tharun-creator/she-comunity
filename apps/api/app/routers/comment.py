from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from uuid import UUID
from app.schemas.comment import CommentCreate, CommentResponse, CommentListResponse
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client
from app.middleware.ratelimit import check_write_rate_limit
from app.services.content_filter import auto_flag_content, create_auto_flag_report
from app.services.notify import notify_on_reply

router = APIRouter()


@router.get("/posts/{post_id}/comments", response_model=CommentListResponse)
async def list_comments(
    post_id: UUID,
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user)
):
    """List comments for a post (threaded)."""
    supabase = get_supabase_client()

    # Verify post exists and is accessible
    post_result = supabase.from_("posts_public").select("pg_id").eq("id", str(post_id)).single()
    if post_result.error or not post_result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    pg_id = post_result.data["pg_id"]

    # Check PG visibility
    pg_result = supabase.from_("pgs").select("id, member_count, review_count").eq("id", pg_id).single()
    if pg_result.error or not pg_result.data:
        raise HTTPException(status_code=404, detail="PG not found")

    pg = pg_result.data
    membership = supabase.from_("pg_memberships").select("id").eq("pg_id", pg_id).eq("user_id", current_user.user_id).single()
    is_member = membership.data is not None
    is_public = (pg.get("member_count", 0) >= 3) or (pg.get("review_count", 0) >= 5)

    if not is_member and not is_public:
        raise HTTPException(status_code=404, detail="Post not found")

    # Get top-level comments
    query = supabase.from_("comments_public").select("*").eq("post_id", str(post_id)).is_("parent_comment_id", "null").order("created_at", ascending=True).limit(limit)

    if cursor:
        query = query.lt("created_at", cursor)

    result = query.execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    # For each top-level comment, fetch replies
    comments = result.data
    for comment in comments:
        replies_result = supabase.from_("comments_public").select("*").eq("parent_comment_id", comment["id"]).order("created_at", ascending=True).execute()
        comment["replies"] = replies_result.data or []

    return CommentListResponse(data=comments, next_cursor=None, has_more=len(comments) == limit)


@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    post_id: UUID,
    comment_data: CommentCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Create a new comment on a post."""
    supabase = get_supabase_client()

    # Verify post exists and is accessible
    post_result = supabase.from_("posts_public").select("pg_id, is_removed").eq("id", str(post_id)).single()
    if post_result.error or not post_result.data or post_result.data.get("is_removed"):
        raise HTTPException(status_code=404, detail="Post not found")

    pg_id = post_result.data["pg_id"]

    # Check PG visibility
    pg_result = supabase.from_("pgs").select("id, member_count, review_count").eq("id", pg_id).single()
    if pg_result.error or not pg_result.data:
        raise HTTPException(status_code=404, detail="PG not found")

    pg = pg_result.data
    membership = supabase.from_("pg_memberships").select("id").eq("pg_id", pg_id).eq("user_id", current_user.user_id).single()
    is_member = membership.data is not None
    is_public = (pg.get("member_count", 0) >= 3) or (pg.get("review_count", 0) >= 5)

    if not is_member and not is_public:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check rate limit
    await check_write_rate_limit(current_user.user_id, "comment")

    # Content filtering
    flag_info = auto_flag_content(comment_data.body, "comment")

    # Get author info
    author_info = {"is_anonymous": comment_data.is_anonymous}
    if not comment_data.is_anonymous:
        user_result = supabase.from_("users").select("display_name, avatar_url").eq("auth_user_id", current_user.user_id).single()
        if user_result.data:
            author_info = {
                "is_anonymous": False,
                "display_name": user_result.data.get("display_name"),
                "avatar_url": user_result.data.get("avatar_url"),
            }
        else:
            author_info = {"is_anonymous": True, "anonymous_tag": "Anonymous Resident"}

    # Insert comment
    insert_data = {
        "post_id": str(post_id),
        "author_id": current_user.user_id,
        "is_anonymous": comment_data.is_anonymous,
        "body": comment_data.body,
        "parent_comment_id": str(comment_data.parent_comment_id) if comment_data.parent_comment_id else None,
    }

    result = supabase.from_("comments").insert(insert_data).select().single()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    comment = result.data

    # Auto-flag if content filter detected issues
    if flag_info:
        await create_auto_flag_report(
            target_type="comment",
            target_id=comment["id"],
            author_id=current_user.user_id,
            flag_info=flag_info,
            supabase_client=supabase
        )

    comment["author"] = author_info
    comment["my_vote"] = 0
    comment["upvotes"] = 0
    comment["downvotes"] = 0

    # Notify post author of new reply (if not replying to own post)
    if comment_data.parent_comment_id is None:  # Top-level comment only
        await notify_on_reply(supabase, str(post_id), current_user.user_id, comment_data.body)

    return CommentResponse(**comment)