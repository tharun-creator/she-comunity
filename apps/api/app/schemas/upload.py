from pydantic import BaseModel, Field, HttpUrl
from typing import Optional


class PresignedUploadRequest(BaseModel):
    file_name: str = Field(..., description="Original filename (e.g. room_photo.jpg)")
    file_type: str = Field(..., description="MIME type (e.g. image/jpeg, image/png, image/webp)")
    folder: Optional[str] = Field("pg-reviews", description="Target folder prefix")


class PresignedUploadResponse(BaseModel):
    upload_url: str = Field(..., description="Presigned PUT URL for direct Cloudflare R2 upload")
    public_url: str = Field(..., description="Public CDN access URL for the uploaded image")
    file_key: str = Field(..., description="R2 object storage key")
