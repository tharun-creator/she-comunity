from pydantic import BaseModel, Field
from typing import Generic, TypeVar, Optional
from datetime import datetime
from uuid import UUID

T = TypeVar("T")


class PaginationParams(BaseModel):
    limit: int = Field(default=20, ge=1, le=100)
    cursor: Optional[str] = None


class CursorPage(BaseModel, Generic[T]):
    data: list[T]
    next_cursor: Optional[str] = None
    has_more: bool = False


def build_cursor_response(data: list[dict], limit: int, cursor_field: str = "created_at") -> tuple[Optional[str], bool]:
    """Build next_cursor and has_more from paginated data."""
    if not data or len(data) < limit:
        return None, False
    last_item = data[-1]
    cursor_value = last_item.get(cursor_field)
    return cursor_value, True


class ErrorDetail(BaseModel):
    code: str
    message: str
    request_id: str
    details: Optional[dict] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database_connected: bool