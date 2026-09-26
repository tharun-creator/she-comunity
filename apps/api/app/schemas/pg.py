from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
from app.schemas.common import CursorPage


class PGBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    area: str = Field(..., pattern="^(OMR-Sholinganallur|Thoraipakkam|Nungambakkam|Velachery|Anna Nagar)$")
    address: Optional[str] = Field(None, max_length=200)


class PGCreate(PGBase):
    pass


class PGResponse(PGBase):
    id: UUID
    founding_user_id: UUID
    member_count: int
    review_count: int
    aggregate_rating: Optional[float] = None
    tag_averages: dict[str, float] = {}
    is_publicly_visible: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PGStats(BaseModel):
    member_count: int
    review_count: int
    aggregate_rating: Optional[float] = None
    tag_averages: dict[str, float] = {}


class PGWithStats(PGResponse):
    stats: PGStats


class PGListResponse(CursorPage[PGResponse]):
    pass


class PGSearchParams(BaseModel):
    q: Optional[str] = None
    area: Optional[str] = None
    limit: int = Field(default=20, ge=1, le=100)
    cursor: Optional[str] = None