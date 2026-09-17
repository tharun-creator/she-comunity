from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional
from uuid import UUID
from app.schemas.report import ReportCreate, ReportResponse, ReportListResponse, ReportAction
from app.middleware.auth import get_current_user, CurrentUser
from app.deps.supabase import get_supabase_client

router = APIRouter()


@router.post("/reports", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    report_data: ReportCreate,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Submit a content report."""
    supabase = get_supabase_client()

    # Verify target exists
    if report_data.target_type == "post":
        target_result = supabase.from_("posts_public").select("id").eq("id", str(report_data.target_id)).single()
    else:
        target_result = supabase.from_("comments_public").select("id").eq("id", str(report_data.target_id)).single()

    if target_result.error or not target_result.data:
        raise HTTPException(status_code=404, detail="Target content not found")

    # Check if user already reported this
    existing = supabase.from_("reports").select("id").eq("reporter_id", current_user.user_id).eq("target_type", report_data.target_type).eq("target_id", str(report_data.target_id)).execute()

    if existing.data:
        raise HTTPException(status_code=409, detail="Already reported this content")

    # Create report
    result = supabase.from_("reports").insert({
        "reporter_id": current_user.user_id,
        "target_type": report_data.target_type,
        "target_id": str(report_data.target_id),
        "reason": report_data.reason,
        "detail": report_data.detail,
    }).select().single()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    return ReportResponse(**result.data)


@router.get("/reports", response_model=ReportListResponse)
async def list_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    reason: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    cursor: Optional[str] = Query(None),
    current_user: CurrentUser = Depends(get_current_user)
):
    """List reports (admin only - requires staff check)."""
    supabase = get_supabase_client()

    # TODO: Add staff/admin check
    # For now, allow any authenticated user to see reports (will be restricted in admin UI)

    query = supabase.from_("reports").select("*").order("created_at", ascending=False).limit(limit)

    if status_filter:
        query = query.eq("status", status_filter)

    if reason:
        query = query.eq("reason", reason)

    if cursor:
        query = query.lt("created_at", cursor)

    result = query.execute()

    if result.error:
        raise HTTPException(status_code=400, detail=result.error.message)

    return ReportListResponse(data=result.data, next_cursor=None, has_more=len(result.data) == limit)


@router.patch("/reports/{report_id}", response_model=ReportResponse)
async def update_report(
    report_id: UUID,
    action: ReportAction,
    current_user: CurrentUser = Depends(get_current_user)
):
    """Take action on a report (admin only)."""
    supabase = get_supabase_client()

    # TODO: Add staff/admin check

    # Get report
    report_result = supabase.from_("reports").select("*").eq("id", str(report_id)).single()
    if report_result.error or not report_result.data:
        raise HTTPException(status_code=404, detail="Report not found")

    report = report_result.data

    if report["status"] != "pending":
        raise HTTPException(status_code=400, detail="Report already processed")

    # Apply action
    if action.action == "dismiss":
        update_data = {"status": "dismissed", "resolved_by": current_user.user_id}
    elif action.action in ["hide", "remove"]:
        update_data = {"status": "actioned", "resolved_by": current_user.user_id}
        # Also hide/remove the content
        if report["target_type"] == "post":
            supabase.from_("posts").update({"is_removed": True}).eq("id", report["target_id"]).execute()
        else:
            supabase.from_("comments").update({"is_removed": True}).eq("id", report["target_id"]).execute()
    elif action.action == "ban_user":
        update_data = {"status": "actioned", "resolved_by": current_user.user_id}
        # Ban the reported content author
        if report["target_type"] == "post":
            post_result = supabase.from_("posts").select("author_id").eq("id", report["target_id"]).single()
            if post_result.data:
                supabase.from_("users").update({"banned_at": "now()"}).eq("id", post_result.data["author_id"]).execute()
        else:
            comment_result = supabase.from_("comments").select("author_id").eq("id", report["target_id"]).single()
            if comment_result.data:
                supabase.from_("users").update({"banned_at": "now()"}).eq("id", comment_result.data["author_id"]).execute()
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    update_result = supabase.from_("reports").update(update_data).eq("id", str(report_id)).select().single()

    if update_result.error:
        raise HTTPException(status_code=400, detail=update_result.error.message)

    return ReportResponse(**update_result.data)