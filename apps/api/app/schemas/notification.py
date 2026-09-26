import enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.common import CursorPage


class NotificationType(str, enum.Enum):
    REPLY = "reply"
    UPVOTE = "upvote"
    MENTION = "mention"
    REPORT_RESOLVED = "report_resolved"


class NotificationResponse(BaseModel):
    id: UUID
    type: NotificationType
    pg_id: UUID
    pg_name: str
    post_id: UUID
    post_excerpt: str
    was_anonymous: bool
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationListResponse(CursorPage[NotificationResponse]):
    pass


class NotificationMarkRead(BaseModel):
    is_read: bool = True