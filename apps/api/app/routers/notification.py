from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from uuid import UUID
from app.schemas.notification import NotificationResponse, NotificationListResponse, NotificationMarkRead
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client

router = APIRouter()


@router.get("/notifications", response_model=NotificationListResponse)
async def list_notifications(
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    unread_only: bool = Query(False),
    current_user: CurrentUser = Depends(get_current_user)
):
    """List notifications for current user."""
    supabase = get_supabase_client()

    query = supabase.from_("notifications").select("*").eq("user_id", current_user.user_id).order("created_at", ascending=False).limit(limit)

    if unread_only:
        query = query.eq("is_read", False)

    if cursor:
        query = query.lt("created_at", cursor)

    result = query.execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    return NotificationListResponse(data=result.data, next_cursor=None, has_more=len(result.data) == limit)


@router.patch("/notifications/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    mark_read: NotificationMarkRead,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Mark notification as read/unread."""
    supabase = get_supabase_client()

    result = supabase.from_("notifications").update({"is_read": mark_read.is_read}).eq("id", str(notification_id)).eq("user_id", current_user.user_id).select().single()

    if result.error or not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")

    return NotificationResponse(**result.data)


@router.patch("/notifications/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_notifications_read(
    current_user: CurrentUser = Depends(get_current_user)
):
    """Mark all notifications as read."""
    supabase = get_supabase_client()

    result = supabase.from_("notifications").update({"is_read": True}).eq("user_id", current_user.user_id).eq("is_read", False).execute()

    return None