from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID
from app.schemas.common import CursorPage
from app.schemas.post import AuthorView


class CommentBase(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    is_anonymous: bool = False
    parent_comment_id: Optional[UUID] = None


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    body: Optional[str] = Field(None, min_length=1, max_length=5000)
    is_anonymous: Optional[bool] = None


class CommentResponse(CommentBase):
    id: UUID
    post_id: UUID
    author: AuthorView
    my_vote: int = 0
    upvotes: int = 0
    downvotes: int = 0
    is_removed: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class CommentListResponse(CursorPage[CommentResponse]):
    pass


class CommentThreadNode(CommentResponse):
    replies: list["CommentThreadNode"] = []


CommentThreadNode.model_rebuild()