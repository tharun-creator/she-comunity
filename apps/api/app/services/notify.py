"""Notification dispatch service for push/email notifications.

Per PRD §5.4.1: External push/email previews must be generic.
Full detail only rendered in-app.
"""

import httpx
import logging
from typing import Optional
from app.core.config import settings

logger = logging.getLogger("she-stays-api.notify")


class NotificationDispatcher:
    """Dispatch notifications via OneSignal (push) and email (SMTP)."""

    def __init__(self):
        self.onesignal_app_id = settings.onesignal_app_id
        self.onesignal_api_key = settings.onesignal_api_key

    async def dispatch_push(
        self,
        user_external_ids: list[str],
        title: str,
        body: str,
        data: Optional[dict] = None
    ) -> bool:
        """Send push notification via OneSignal.
        
        Per PRD §5.4.1: External previews must be generic.
        The actual title/body here should be generic, not specific.
        """
        if not self.onesignal_app_id or not self.onesignal_api_key:
            logger.warning("OneSignal not configured, skipping push")
            return False

        # Generic push content per PRD §5.4.1
        generic_title = "SheStays Community"
        generic_body = "You have a new notification"

        payload = {
            "app_id": self.onesignal_app_id,
            "include_external_user_ids": user_external_ids,
            "headings": {"en": generic_title},
            "contents": {"en": generic_body},
            "data": data or {},
            "content_available": True,
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    "https://onesignal.com/api/v1/notifications",
                    json=payload,
                    headers={
                        "Authorization": f"Basic {self.onesignal_api_key}",
                        "Content-Type": "application/json",
                    },
                    timeout=10.0,
                )
                response.raise_for_status()
                logger.info(f"Push sent to {len(user_external_ids)} users")
                return True
            except Exception as e:
                logger.error(f"OneSignal push failed: {e}")
                return False

    async def dispatch_email(
        self,
        to_email: str,
        subject: str,
        html_body: str,
        text_body: Optional[str] = None
    ) -> bool:
        """Send email via SMTP.
        
        Per PRD §5.4.1: External previews must be generic.
        Subject and preview text should be generic.
        """
        if not all([settings.smtp_host, settings.smtp_user, settings.smtp_password]):
            logger.warning("SMTP not configured, skipping email")
            return False

        # Generic subject per PRD §5.4.1
        generic_subject = "New notification from SheStays"

        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart("alternative")
            msg["Subject"] = generic_subject
            msg["From"] = settings.smtp_user
            msg["To"] = to_email

            # Generic preview text
            msg.attach(MIMEText(text_body or "You have a new notification in SheStays Community.", "plain"))
            msg.attach(MIMEText(html_body, "html"))

            with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
                server.starttls()
                server.login(settings.smtp_user, settings.smtp_password)
                server.send_message(msg)

            logger.info(f"Email sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Email send failed: {e}")
            return False


# Singleton instance
dispatcher = NotificationDispatcher()


async def create_notification(
    user_id: str,
    type: str,  # reply, upvote, mention, report_resolved
    pg_id: str,
    pg_name: str,
    post_id: str,
    post_excerpt: str,
    was_anonymous: bool,
    supabase_client
) -> str:
    """Create in-app notification and dispatch push/email."""
    result = supabase_client.from_("notifications").insert({
        "user_id": user_id,
        "type": type,
        "pg_id": pg_id,
        "pg_name": pg_name,
        "post_id": post_id,
        "post_excerpt": post_excerpt,
        "was_anonymous": was_anonymous,
        "is_read": False,
    }).select().single()

    if result.error:
        logger.error(f"Failed to create notification: {result.error}")
        return None

    notification = result.data

    # Dispatch push/email asynchronously (don't block)
    try:
        # Get user's external ID for OneSignal (stored in users.onesignal_external_id)
        user_result = supabase_client.from_("users").select("email, onesignal_external_id").eq("id", user_id).single().execute()
        if user_result.data:
            external_id = user_result.data.get("onesignal_external_id")
            email = user_result.data.get("email")

            if external_id:
                # Dispatch push with generic content
                await dispatcher.dispatch_push(
                    user_external_ids=[external_id],
                    title="SheStays Community",
                    body="You have a new notification",
                    data={
                        "notification_id": notification["id"],
                        "type": type,
                        "pg_id": pg_id,
                        "post_id": post_id,
                    }
                )

            if email:
                # Dispatch email with generic content
                await dispatcher.dispatch_email(
                    to_email=email,
                    subject="New notification from SheStays",
                    html_body=f"""
                        <p>You have a new notification in SheStays Community.</p>
                        <p>Open the app to view details.</p>
                    """,
                    text_body="You have a new notification in SheStays Community. Open the app to view details."
                )

    except Exception as e:
        logger.error(f"Notification dispatch failed: {e}")

    return notification["id"]


async def notify_on_reply(supabase_client, post_id: str, reply_author_id: str, reply_body: str):
    """Trigger notifications when someone replies to a post."""
    post = supabase_client.from_("posts_public").select("author_id, pg_id, pg_name, title, body, is_anonymous").eq("id", post_id).single().execute()
    if not post.data or post.data["author_id"] == reply_author_id:
        return

    await create_notification(
        user_id=post.data["author_id"],
        type="reply",
        pg_id=post.data["pg_id"],
        pg_name=post.data["pg_name"],
        post_id=post_id,
        post_excerpt=reply_body[:100],
        was_anonymous=post.data["is_anonymous"],
        supabase_client=supabase_client
    )


async def notify_on_upvote(supabase_client, target_type: str, target_id: str, voter_id: str):
    """Trigger notifications when someone upvotes a post/comment."""
    if target_type == "post":
        post = supabase_client.from_("posts_public").select("author_id, pg_id, pg_name, title, body, is_anonymous").eq("id", target_id).single().execute()
        if not post.data or post.data["author_id"] == voter_id:
            return

        await create_notification(
            user_id=post.data["author_id"],
            type="upvote",
            pg_id=post.data["pg_id"],
            pg_name=post.data["pg_name"],
            post_id=target_id,
            post_excerpt=post.data["title"],
            was_anonymous=post.data["is_anonymous"],
            supabase_client=supabase_client
        )
    elif target_type == "comment":
        comment = supabase_client.from_("comments_public").select("author_id, post_id, body, is_anonymous").eq("id", target_id).single().execute()
        if not comment.data or comment.data["author_id"] == voter_id:
            return

        post = supabase_client.from_("posts_public").select("pg_id, pg_name").eq("id", comment.data["post_id"]).single().execute()
        if not post.data:
            return

        await create_notification(
            user_id=comment.data["author_id"],
            type="upvote",
            pg_id=post.data["pg_id"],
            pg_name=post.data["pg_name"],
            post_id=comment.data["post_id"],
            post_excerpt=comment.data["body"][:100],
            was_anonymous=comment.data["is_anonymous"],
            supabase_client=supabase_client
        )


async def notify_on_report_resolved(supabase_client, reporter_id: str, report_id: str, report_reason: str):
    """Trigger notification when a report is resolved."""
    await create_notification(
        user_id=reporter_id,
        type="report_resolved",
        pg_id="",
        pg_name="",
        post_id=report_id,
        post_excerpt=f"Your report ({report_reason}) was reviewed",
        was_anonymous=False,
        supabase_client=supabase_client
    )