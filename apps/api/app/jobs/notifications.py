"""Background jobs for notifications and other async tasks."""

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from app.deps.supabase import get_supabase_client
from app.services.notify import (
    notify_on_reply,
    notify_on_upvote,
    notify_on_report_resolved,
)
import logging

logger = logging.getLogger("she-stays-api.jobs")

scheduler = AsyncIOScheduler()


async def process_pending_notifications():
    """Process any pending notifications that need to be dispatched.
    
    This runs periodically to catch any notifications that weren't
    dispatched at creation time (e.g., if OneSignal was down).
    """
    supabase = get_supabase_client()
    
    # Find notifications that haven't been dispatched
    # (In a real app, you'd add a `dispatched` column to notifications table)
    pass


async def cleanup_old_notifications():
    """Clean up old read notifications (older than 90 days)."""
    supabase = get_supabase_client()
    
    from datetime import datetime, timedelta, timezone
    cutoff = datetime.now(timezone.utc) - timedelta(days=90)
    
    result = supabase.from_("notifications").delete().eq("is_read", True).lt("created_at", cutoff.isoformat()).execute()
    if result.error:
        logger.error(f"Notification cleanup failed: {result.error}")
    else:
        logger.info(f"Cleaned up {len(result.data or [])} old notifications")


def init_scheduler():
    """Initialize and start the background job scheduler."""
    # Process pending notifications every 5 minutes
    scheduler.add_job(
        process_pending_notifications,
        IntervalTrigger(minutes=5),
        id="process_notifications",
        replace_existing=True,
    )
    
    # Cleanup old notifications daily at 3 AM
    scheduler.add_job(
        cleanup_old_notifications,
        IntervalTrigger(hours=24),
        id="cleanup_notifications",
        replace_existing=True,
    )
    
    scheduler.start()
    logger.info("Background job scheduler started")


def shutdown_scheduler():
    """Shutdown the scheduler gracefully."""
    scheduler.shutdown()
    logger.info("Background job scheduler stopped")