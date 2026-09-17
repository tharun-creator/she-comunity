from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from uuid import UUID
from app.schemas.common import CursorPage
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client
from app.schemas.report import ReportReason

router = APIRouter()


async def require_admin(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Check if user is admin/staff."""
    supabase = get_supabase_client()
    result = supabase.from_("users").select("is_staff").eq("auth_user_id", current_user.user_id).single()
    if result.error or not result.data or not result.data.get("is_staff"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/admin/check")
async def check_admin(current_user: CurrentUser = Depends(require_admin)):
    """Check if current user is admin."""
    return {"is_staff": True}


@router.get("/admin/stats")
async def get_admin_stats(current_user: CurrentUser = Depends(require_admin)):
    """Get platform statistics for admin dashboard."""
    supabase = get_supabase_client()

    total_users = supabase.from_("users").select("id", count="exact").execute().count or 0
    total_pgs = supabase.from_("pgs").select("id", count="exact").execute().count or 0
    total_posts = supabase.from_("posts").select("id", count="exact").eq("is_removed", False).execute().count or 0
    total_reports = supabase.from_("reports").select("id", count="exact").execute().count or 0
    pending_reports = supabase.from_("reports").select("id", count="exact").eq("status", "pending").execute().count or 0

    # Reports in last 24h
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    reports_24h = supabase.from_("reports").select("id", count="exact").gte("created_at", cutoff.isoformat()).execute().count or 0

    return {
        "total_users": total_users,
        "total_pgs": total_pgs,
        "total_posts": total_posts,
        "total_reports": total_reports,
        "pending_reports": pending_reports,
        "reports_last_24h": reports_24h,
    }


@router.get("/admin/reports")
async def list_reports(
    status: Optional[str] = Query(None),
    reason: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    cursor: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(require_admin)
):
    """List reports with filters."""
    supabase = get_supabase_client()

    query = supabase.from_("reports").select("*, target_preview:target_id(title, body), pg_name:pgs!target_pg_id(name)").order("created_at", ascending=False).limit(limit)

    if status:
        query = query.eq("status", status)
    if reason:
        query = query.eq("reason", reason)
    if cursor:
        query = query.lt("created_at", cursor)

    result = query.execute()
    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    # Enrich with target preview
    enriched = []
    for r in result.data:
        target_preview = ""
        target_author = ""
        pg_name = ""
        
        if r["target_type"] == "post":
            post = supabase.from_("posts_public").select("title, body, author, pg_id").eq("id", r["target_id"]).single().execute()
            if post.data:
                target_preview = post.data.get("title", "")[:100]
                target_author = post.data.get("author", {}).get("display_name", "Anonymous")
                pg = supabase.from_("pgs").select("name").eq("id", post.data.get("pg_id")).single().execute()
                if pg.data:
                    pg_name = pg.data.get("name", "")
        else:
            comment = supabase.from_("comments_public").select("body, author, post_id").eq("id", r["target_id"]).single().execute()
            if comment.data:
                target_preview = comment.data.get("body", "")[:100]
                target_author = comment.data.get("author", {}).get("display_name", "Anonymous")
                post = supabase.from_("posts_public").select("pg_id").eq("id", comment.data.get("post_id")).single().execute()
                if post.data:
                    pg = supabase.from_("pgs").select("name").eq("id", post.data.get("pg_id")).single().execute()
                    if pg.data:
                        pg_name = pg.data.get("name", "")

        enriched.append({
            **r,
            "target_preview": target_preview,
            "target_author": target_author,
            "pg_name": pg_name,
        })

    return enriched


@router.patch("/admin/reports/{report_id}")
async def update_report(
    report_id: UUID,
    action: dict,  # {"action": "hide"|"remove"|"dismiss"|"ban_user"}
    current_user: CurrentUser = Depends(require_admin)
):
    """Take action on a report."""
    supabase = get_supabase_client()
    action_type = action.get("action")

    # Get report
    report_result = supabase.from_("reports").select("*").eq("id", str(report_id)).single()
    if report_result.error or not report_result.data:
        raise HTTPException(status_code=404, detail="Report not found")

    report = report_result.data

    if report["status"] != "pending":
        raise HTTPException(status_code=400, detail="Report already processed")

    if action_type == "dismiss":
        update_data = {"status": "dismissed", "resolved_by": current_user.user_id}
    elif action_type in ["hide", "remove"]:
        update_data = {"status": "actioned", "resolved_by": current_user.user_id}
        if report["target_type"] == "post":
            supabase.from_("posts").update({"is_removed": True}).eq("id", report["target_id"]).execute()
        else:
            supabase.from_("comments").update({"is_removed": True}).eq("id", report["target_id"]).execute()
    elif action_type == "ban_user":
        update_data = {"status": "actioned", "resolved_by": current_user.user_id}
        if report["target_type"] == "post":
            post = supabase.from_("posts").select("author_id").eq("id", report["target_id"]).single().execute()
            if post.data:
                supabase.from_("users").update({"banned_at": "now()"}).eq("id", post.data["author_id"]).execute()
        else:
            comment = supabase.from_("comments").select("author_id").eq("id", report["target_id"]).single().execute()
            if comment.data:
                supabase.from_("users").update({"banned_at": "now()"}).eq("id", comment.data["author_id"]).execute()
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    update_result = supabase.from_("reports").update(update_data).eq("id", str(report_id)).select().single()
    if update_result.error:
        raise HTTPException(status_code=400, detail=update_result.error.message)

    # Log the moderation action
    supabase.from_("moderation_logs").insert({
        "moderator_id": current_user.user_id,
        "action": action_type,
        "target_type": report["target_type"],
        "target_id": report["target_id"],
        "reason": report["reason"],
    }).execute()

    return update_result.data


@router.get("/admin/users")
async def list_users(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    current_user: CurrentUser = Depends(require_admin)
):
    """List users with filters."""
    supabase = get_supabase_client()

    query = supabase.from_("users").select("*, posts:count(id), reports:count(id)").order("created_at", ascending=False).limit(limit)

    if search:
        query = query.ilike("display_name", f"%{search}%")
    if status == "active":
        query = query.is_("banned_at", "null")
    elif status == "banned":
        query = query.not_.is_("banned_at", "null")

    result = query.execute()
    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    return result.data


@router.post("/admin/users/{user_id}/action")
async def user_action(
    user_id: UUID,
    action: dict,  # {"action": "ban"|"unban"|"verify"|"delete"}
    current_user: CurrentUser = Depends(require_admin)
):
    """Take action on a user."""
    supabase = get_supabase_client()
    action_type = action.get("action")

    if action_type == "ban":
        supabase.from_("users").update({"banned_at": "now()"}).eq("id", str(user_id)).execute()
    elif action_type == "unban":
        supabase.from_("users").update({"banned_at": None}).eq("id", str(user_id)).execute()
    elif action_type == "verify":
        supabase.from_("users").update({"women_attested_at": "now()"}).eq("id", str(user_id)).execute()
    elif action_type == "delete":
        # Soft delete - ban and remove content
        supabase.from_("users").update({"banned_at": "now()"}).eq("id", str(user_id)).execute()
        supabase.from_("posts").update({"is_removed": True}).eq("author_id", str(user_id)).execute()
        supabase.from_("comments").update({"is_removed": True}).eq("author_id", str(user_id)).execute()
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    # Log the action
    supabase.from_("moderation_logs").insert({
        "moderator_id": current_user.user_id,
        "action": action_type,
        "target_type": "user",
        "target_id": str(user_id),
    }).execute()

    return {"success": True}


@router.get("/admin/logs")
async def list_logs(
    action: Optional[str] = Query(None),
    moderator: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: CurrentUser = Depends(require_admin)
):
    """List moderation logs."""
    supabase = get_supabase_client()

    query = supabase.from_("moderation_logs").select("*, moderator:users!moderator_id(display_name)").order("created_at", ascending=False).limit(limit)

    if action:
        query = query.eq("action", action)
    if moderator:
        query = query.eq("moderator_id", moderator)
    if search:
        query = query.or_(f"target_preview.ilike.%{search}%,moderator.display_name.ilike.%{search}%")

    result = query.execute()
    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    # Format moderator name
    for log in result.data:
        if log.get("moderator"):
            log["moderator_name"] = log["moderator"]["display_name"]
        else:
            log["moderator_name"] = "Unknown"

    return result.data


@router.get("/admin/settings")
async def get_settings(current_user: CurrentUser = Depends(require_admin)):
    """Get platform settings."""
    # In a real app, this would come from a settings table
    # For now, return defaults
    return {
        "site_name": "SheStays Community",
        "site_url": "https://community.shestays.app",
        "maintenance_mode": False,
        "allow_anonymous_posts": True,
        "max_posts_per_day": 3,
        "max_votes_per_day": 20,
        "auto_flag_threshold": 5,
        "profanity_filter_enabled": True,
        "pii_filter_enabled": True,
        "onesignal_app_id": "",
        "onesignal_api_key": "",
        "smtp_host": "",
        "smtp_port": 587,
        "smtp_user": "",
        "smtp_password": "",
    }


@router.patch("/admin/settings")
async def update_settings(
    settings: dict,
    current_user: CurrentUser = Depends(require_admin)
):
    """Update platform settings."""
    # In a real app, this would update a settings table
    # For now, just acknowledge
    return {"success": True, "settings": settings}


# Moderation logs table creation SQL (run once)
MODERATION_LOGS_SQL = """
create table if not exists moderation_logs (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid not null references users(id),
  action text not null check (action in ('hide', 'remove', 'dismiss', 'ban_user', 'unban', 'verify')),
  target_type text not null check (target_type in ('post', 'comment', 'user')),
  target_id uuid not null,
  target_preview text,
  reason text,
  created_at timestamptz not null default now()
);

create index on moderation_logs (moderator_id, created_at desc);
create index on moderation_logs (target_type, target_id);
create index on moderation_logs (action, created_at desc);

-- Add is_staff column to users
alter table users add column if not exists is_staff boolean not null default false;
"""