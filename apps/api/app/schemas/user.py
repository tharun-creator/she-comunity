from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID
from app.schemas.common import CursorPage


class UserProfile(BaseModel):
    id: UUID
    display_name: str
    avatar_url: Optional[str] = None
    city: str
    pgs_lived_at: list[UUID] = []
    saved_pg_ids: list[UUID] = []
    joined_pg_ids: list[UUID] = []
    account_created_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    phone_verified_at: Optional[datetime] = None
    women_attested_at: Optional[datetime] = None

    def __init__(self, **data):
        if "account_created_at" not in data and "created_at" in data:
            data["account_created_at"] = data["created_at"]
        elif "created_at" not in data and "account_created_at" in data:
            data["created_at"] = data["account_created_at"]
        super().__init__(**data)

    class Config:
        from_attributes = True


class WomenAttestationRequest(BaseModel):
    attested: bool = True


class UserMembership(BaseModel):
    pg_id: UUID
    pg_name: str
    area: str
    joined_at: datetime

    class Config:
        from_attributes = True


class UserMembershipsResponse(CursorPage[UserMembership]):
    pass