from fastapi import APIRouter, Depends, HTTPException, status
from uuid import UUID
from app.schemas.vote import VoteRequest, PollVoteRequest, VoteResponse, PollVoteResponse
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client
from app.middleware.ratelimit import check_write_rate_limit

router = APIRouter()


@router.post("/posts/{post_id}/vote", response_model=VoteResponse)
async def vote_post(
    post_id: UUID,
    vote_data: VoteRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Vote on a post (upvote=1, downvote=-1, remove=0)."""
    supabase = get_supabase_client()

    # Check rate limit
    await check_write_rate_limit(current_user.user_id, "vote")

    # Verify post exists
    post_result = supabase.from_("posts_public").select("id").eq("id", str(post_id)).single()
    if post_result.error or not post_result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    # Upsert vote (unique constraint on user_id, target_type, target_id)
    vote_result = supabase.from_("votes").upsert({
        "user_id": current_user.user_id,
        "target_type": "post",
        "target_id": str(post_id),
        "direction": vote_data.direction,
    }).execute()

    if vote_result.error:
        raise HTTPException(status_code=400, detail=vote_result.error.message)

    # Get updated counts
    upvotes = supabase.from_("votes").select("id", count="exact").eq("target_type", "post").eq("target_id", str(post_id)).eq("direction", 1).execute().count or 0
    downvotes = supabase.from_("votes").select("id", count="exact").eq("target_type", "post").eq("target_id", str(post_id)).eq("direction", -1).execute().count or 0

    my_vote = vote_data.direction if vote_data.direction != 0 else 0

    return VoteResponse(upvotes=upvotes, downvotes=downvotes, my_vote=my_vote)


@router.post("/comments/{comment_id}/vote", response_model=VoteResponse)
async def vote_comment(
    comment_id: UUID,
    vote_data: VoteRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Vote on a comment."""
    supabase = get_supabase_client()

    await check_write_rate_limit(current_user.user_id, "vote")

    # Verify comment exists
    comment_result = supabase.from_("comments_public").select("id").eq("id", str(comment_id)).single()
    if comment_result.error or not comment_result.data:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Upsert vote
    vote_result = supabase.from_("votes").upsert({
        "user_id": current_user.user_id,
        "target_type": "comment",
        "target_id": str(comment_id),
        "direction": vote_data.direction,
    }).execute()

    if vote_result.error:
        raise HTTPException(status_code=400, detail=vote_result.error.message)

    # Get updated counts
    upvotes = supabase.from_("votes").select("id", count="exact").eq("target_type", "comment").eq("target_id", str(comment_id)).eq("direction", 1).execute().count or 0
    downvotes = supabase.from_("votes").select("id", count="exact").eq("target_type", "comment").eq("target_id", str(comment_id)).eq("direction", -1).execute().count or 0

    my_vote = vote_data.direction if vote_data.direction != 0 else 0

    return VoteResponse(upvotes=upvotes, downvotes=downvotes, my_vote=my_vote)


@router.post("/posts/{post_id}/poll/vote", response_model=PollVoteResponse)
async def vote_poll(
    post_id: UUID,
    vote_data: PollVoteRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Vote on a poll option."""
    supabase = get_supabase_client()

    await check_write_rate_limit(current_user.user_id, "vote")

    # Get post with poll options
    post_result = supabase.from_("posts_public").select("poll_options, my_poll_vote").eq("id", str(post_id)).single()
    if post_result.error or not post_result.data:
        raise HTTPException(status_code=404, detail="Post not found")

    post = post_result.data
    poll_options = post.get("poll_options") or []
    my_poll_vote = post.get("my_poll_vote")

    if not poll_options:
        raise HTTPException(status_code=400, detail="Not a poll post")

    if my_poll_vote:
        raise HTTPException(status_code=400, detail="Already voted on this poll")

    # Find and update the option
    option_found = False
    for opt in poll_options:
        if opt["id"] == vote_data.option_id:
            opt["vote_count"] = opt.get("vote_count", 0) + 1
            option_found = True
            break

    if not option_found:
        raise HTTPException(status_code=404, detail="Poll option not found")

    # Update post with new poll options and user's vote
    update_result = supabase.from_("posts").update({
        "poll_options": poll_options,
    }).eq("id", str(post_id)).execute()

    if update_result.error:
        raise HTTPException(status_code=400, detail=update_result.error.message)

    # Record user's poll vote in votes table
    supabase.from_("votes").insert({
        "user_id": current_user.user_id,
        "target_type": "poll",
        "target_id": str(post_id),
        "direction": 1,  # For polls, direction is always 1 (voted)
    }).execute()

    # Build response with is_my_vote flags
    response_options = []
    for opt in poll_options:
        response_options.append({
            "id": opt["id"],
            "label": opt["label"],
            "vote_count": opt["vote_count"],
            "is_my_vote": opt["id"] == vote_data.option_id,
        })

    return PollVoteResponse(poll_options=response_options, my_poll_vote=vote_data.option_id)