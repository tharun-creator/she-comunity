import enum
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.common import CursorPage


class ReportReason(str, enum.Enum):
    HARASSMENT = "harassment"
    FAKE_REVIEW = "fake_review"
    DOXXING = "doxxing"
    SPAM = "spam"
    OTHER = "other"


class ReportCreate(BaseModel):
    target_type: str = Field(..., pattern="^(post|comment)$")
    target_id: UUID
    reason: ReportReason
    detail: Optional[str] = Field(None, max_length=1000)


class ReportResponse(BaseModel):
    id: UUID
    reporter_id: UUID
    target_type: str
    target_id: UUID
    reason: ReportReason
    detail: Optional[str] = None
    status: str = Field(default="pending", pattern="^(pending|actioned|dismissed)$")
    created_at: datetime

    class Config:
        from_attributes = True


class ReportListResponse(CursorPage[ReportResponse]):
    pass


class ReportAction(BaseModel):
    action: str = Field(..., pattern="^(hide|remove|dismiss|ban_user)$")