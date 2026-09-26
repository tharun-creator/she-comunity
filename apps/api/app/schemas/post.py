from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
from app.schemas.common import CursorPage


class PollOptionCreate(BaseModel):
    label: str = Field(..., min_length=1, max_length=100)


class PollOptionResponse(BaseModel):
    id: str
    label: str
    vote_count: int


class PostBase(BaseModel):
    type: str = Field(..., pattern="^(review|discussion|poll)$")
    title: str = Field(..., min_length=1, max_length=200)
    body: str = Field(..., min_length=1, max_length=10000)
    is_anonymous: bool = False
    residency_claim: Optional[str] = Field(None, pattern="^(stayed_here|currently_here)$")
    rating_tags: Optional[dict[str, int]] = None  # {"Safety": 5, "Food": 3}
    overall_rating: Optional[float] = Field(None, ge=1, le=5)
    poll_options: Optional[list[PollOptionCreate]] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    topics: Optional[list[str]] = None


class PostCreate(PostBase):
    pass


class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    body: Optional[str] = Field(None, min_length=1, max_length=10000)
    is_anonymous: Optional[bool] = None
    residency_claim: Optional[str] = Field(None, pattern="^(stayed_here|currently_here)$")
    rating_tags: Optional[dict[str, int]] = None
    overall_rating: Optional[float] = Field(None, ge=1, le=5)
    poll_options: Optional[list[PollOptionCreate]] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    topics: Optional[list[str]] = None


class AuthorView(BaseModel):
    is_anonymous: bool
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    anonymous_tag: Optional[str] = None


class PostResponse(PostBase):
    id: UUID
    pg_id: UUID
    author: AuthorView
    my_vote: int = 0
    upvotes: int = 0
    downvotes: int = 0
    comment_count: int = 0
    my_poll_vote: Optional[str] = None
    is_saved: bool = False
    is_removed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class PostListResponse(CursorPage[PostResponse]):
    pass


class PostSort(str):
    """Post sort options."""
    NEW = "new"
    TOP = "top"
    DISCUSSED = "discussed"

    @classmethod
    def values(cls):
        return [cls.NEW, cls.TOP, cls.DISCUSSED]


class PostListParams(BaseModel):
    sort: str = Field(default="new", pattern="^(new|top|discussed)$")
    limit: int = Field(default=20, ge=1, le=100)
    cursor: Optional[str] = None