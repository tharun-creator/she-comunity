import uuid
import logging
from fastapi import APIRouter, Depends, status
from app.schemas.upload import PresignedUploadRequest, PresignedUploadResponse
from app.middleware.auth import get_current_user, CurrentUser
from app.middleware.errors import BadRequestError
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


@router.post("/uploads/presigned-url", response_model=PresignedUploadResponse)
async def get_presigned_upload_url(
    request_data: PresignedUploadRequest,
    current_user: CurrentUser = Depends(get_current_user)
):
    """
    Generate a presigned upload URL for direct client-side upload to Cloudflare R2 / S3.
    This avoids routing heavy image file payloads through the FastAPI application server.
    """
    if request_data.file_type.lower() not in ALLOWED_MIME_TYPES:
        raise BadRequestError(f"Invalid file type. Allowed types: {', '.join(ALLOWED_MIME_TYPES)}")

    file_ext = request_data.file_name.split(".")[-1] if "." in request_data.file_name else "jpg"
    unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
    folder_prefix = request_data.folder.strip("/") if request_data.folder else "pg-reviews"
    file_key = f"{folder_prefix}/{current_user.user_id}/{unique_filename}"

    # Build Cloudflare R2 / S3 endpoint URL
    if settings.r2_account_id:
        r2_endpoint = f"https://{settings.r2_account_id}.r2.cloudflarestorage.com"
        public_base = settings.r2_public_domain if settings.r2_public_domain else f"https://pub-{settings.r2_account_id}.r2.dev"
    else:
        # Development fallback endpoint
        r2_endpoint = f"http://localhost:9000"
        public_base = f"http://localhost:9000/{settings.r2_bucket_name}"

    try:
        import boto3
        from botocore.config import Config

        s3_client = boto3.client(
            "s3",
            endpoint_url=r2_endpoint,
            aws_access_key_id=settings.r2_access_key_id or "mock",
            aws_secret_access_key=settings.r2_secret_access_key or "mock",
            config=Config(signature_version="s3v4"),
            region_name="auto"
        )

        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.r2_bucket_name,
                "Key": file_key,
                "ContentType": request_data.file_type,
            },
            ExpiresIn=900  # 15 minutes
        )
    except Exception as exc:
        logger.warning(f"S3 client not configured, returning mock presigned URL: {exc}")
        upload_url = f"{r2_endpoint}/{settings.r2_bucket_name}/{file_key}?mock_presigned=true"

    public_url = f"{public_base.rstrip('/')}/{file_key}"

    return PresignedUploadResponse(
        upload_url=upload_url,
        public_url=public_url,
        file_key=file_key
    )
