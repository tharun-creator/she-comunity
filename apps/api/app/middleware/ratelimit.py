import time
import logging
from collections import defaultdict
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from app.core.config import settings

logger = logging.getLogger(__name__)

# In-memory rate limit store (use Redis in production)
_rate_limit_store: dict[str, list[float]] = defaultdict(list)
_user_action_counts: dict[str, dict[str, int]] = defaultdict(lambda: {"posts": 0, "votes": 0, "comments": 0})


def _clean_old_entries(key: str, window: int) -> None:
    """Remove entries older than the window."""
    now = time.time()
    _rate_limit_store[key] = [ts for ts in _rate_limit_store[key] if now - ts < window]


def _get_client_key(request: Request, user_id: str | None = None) -> str:
    """Generate rate limit key from user ID or IP."""
    if user_id:
        return f"user:{user_id}"
    client_ip = request.client.host if request.client else "unknown"
    return f"ip:{client_ip}"


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Global rate limiting middleware."""

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/healthz", "/ready"]:
            return await call_next(request)

        # Get user ID from request state (set by auth middleware)
        user_id = getattr(request.state, "user_id", None)
        key = _get_client_key(request, user_id)

        _clean_old_entries(key, settings.rate_limit_window)
        current_count = len(_rate_limit_store[key])

        if current_count >= settings.rate_limit_requests:
            retry_after = settings.rate_limit_window
            logger.warning(f"Rate limit exceeded for {key}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded",
                headers={"Retry-After": str(retry_after)}
            )

        _rate_limit_store[key].append(time.time())

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(settings.rate_limit_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, settings.rate_limit_requests - current_count - 1))
        response.headers["X-RateLimit-Reset"] = str(int(time.time() + settings.rate_limit_window))

        return response


async def check_write_rate_limit(user_id: str, action_type: str) -> None:
    """
    Check PRD §5.5 rate limits for write operations.
    
    Limits (per account, not per anonymous post):
    - Accounts < 24h old: max 3 posts/comments, 20 votes per 24h
    - Accounts < 5 lifetime approved actions: max 10 posts/comments per rolling 24h
    """
    from app.deps.supabase import get_supabase_client
    
    supabase = get_supabase_client()
    
    # Get user account info
    user_resp = supabase.from_("users").select("account_created_at, women_attested_at").eq("auth_user_id", user_id).single()
    if not user_resp.data:
        return  # User not found, let it pass (will fail later)
    
    user_data = user_resp.data
    account_created = user_data.get("account_created_at")
    
    if not account_created:
        return
    
    from datetime import datetime, timezone
    account_age_hours = (datetime.now(timezone.utc) - datetime.fromisoformat(account_created.replace("Z", "+00:00"))).total_seconds() / 3600
    
    # Get lifetime approved actions count
    posts_count = supabase.from_("posts").select("id", count="exact").eq("author_id", user_id).eq("is_removed", False).execute()
    comments_count = supabase.from_("comments").select("id", count="exact").eq("author_id", user_id).eq("is_removed", False).execute()
    lifetime_actions = (posts_count.count or 0) + (comments_count.count or 0)
    
    # Get recent actions (last 24h)
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_posts = supabase.from_("posts").select("id", count="exact").eq("author_id", user_id).gte("created_at", cutoff.isoformat()).execute()
    recent_comments = supabase.from_("comments").select("id", count="exact").eq("author_id", user_id).gte("created_at", cutoff.isoformat()).execute()
    recent_votes = supabase.from_("votes").select("id", count="exact").eq("user_id", user_id).gte("created_at", cutoff.isoformat()).execute()
    
    recent_posts_count = recent_posts.count or 0
    recent_comments_count = recent_comments.count or 0
    recent_votes_count = recent_votes.count or 0
    
    # Apply limits
    if account_age_hours < 24:
        # New accounts: 3 posts/comments, 20 votes per 24h
        if action_type in ["post", "comment"] and (recent_posts_count + recent_comments_count) >= 3:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="New accounts limited to 3 posts/comments per 24 hours",
                headers={"Retry-After": "86400"}
            )
        if action_type == "vote" and recent_votes_count >= 20:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="New accounts limited to 20 votes per 24 hours",
                headers={"Retry-After": "86400"}
            )
    
    if lifetime_actions < 5:
        # Low reputation accounts: 10 posts/comments per 24h
        if action_type in ["post", "comment"] and (recent_posts_count + recent_comments_count) >= 10:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Accounts with fewer than 5 lifetime actions limited to 10 posts/comments per 24 hours",
                headers={"Retry-After": "86400"}
            )