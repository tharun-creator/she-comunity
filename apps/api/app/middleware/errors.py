from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging
import traceback
import uuid
from typing import Any

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base application error with status code and error code."""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_ERROR",
        details: dict[str, Any] | None = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class BadRequestError(AppError):
    def __init__(self, message: str, details: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, "BAD_REQUEST", details)


class UnauthorizedError(AppError):
    def __init__(self, message: str = "Unauthorized", details: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, "UNAUTHORIZED", details)


class ForbiddenError(AppError):
    def __init__(self, message: str = "Forbidden", details: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, "FORBIDDEN", details)


class NotFoundError(AppError):
    def __init__(self, message: str = "Not found", details: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, "NOT_FOUND", details)


class RateLimitError(AppError):
    def __init__(self, message: str = "Rate limit exceeded", retry_after: int = 60):
        super().__init__(
            message,
            status.HTTP_429_TOO_MANY_REQUESTS,
            "RATE_LIMITED",
            {"retry_after": retry_after}
        )


class ConflictError(AppError):
    def __init__(self, message: str = "Conflict", details: dict[str, Any] | None = None):
        super().__init__(message, status.HTTP_409_CONFLICT, "CONFLICT", details)


def create_error_response(
    request: Request,
    error_code: str,
    message: str,
    status_code: int,
    details: dict[str, Any] | None = None
) -> JSONResponse:
    """Create standardized error response envelope."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    error_body = {
        "error": {
            "code": error_code,
            "message": message,
            "request_id": request_id,
        }
    }

    if details:
        error_body["error"]["details"] = details

    return JSONResponse(
        status_code=status_code,
        content=error_body,
        headers={"X-Request-ID": request_id}
    )


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Handle custom application errors."""
    logger.warning(
        f"AppError: {exc.error_code} - {exc.message}",
        extra={"request_id": getattr(request.state, "request_id", "unknown"), "details": exc.details}
    )
    return create_error_response(
        request,
        exc.error_code,
        exc.message,
        exc.status_code,
        exc.details
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    """Handle Starlette HTTP exceptions."""
    logger.warning(
        f"HTTPException: {exc.status_code} - {exc.detail}",
        extra={"request_id": getattr(request.state, "request_id", "unknown")}
    )
    return create_error_response(
        request,
        "HTTP_ERROR",
        str(exc.detail),
        exc.status_code
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    logger.warning(
        f"ValidationError: {exc.errors()}",
        extra={"request_id": getattr(request.state, "request_id", "unknown")}
    )
    return create_error_response(
        request,
        "VALIDATION_ERROR",
        "Invalid request data",
        status.HTTP_422_UNPROCESSABLE_ENTITY,
        {"errors": exc.errors()}
    )


async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions - never leak stack traces in production."""
    request_id = getattr(request.state, "request_id", str(uuid.uuid4()))

    logger.error(
        f"Unhandled exception: {type(exc).__name__}: {str(exc)}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
            "method": request.method,
        },
        exc_info=True
    )

    # In production, never expose internal error details
    if settings.app_env == "production":
        return create_error_response(
            request,
            "INTERNAL_ERROR",
            "An unexpected error occurred",
            status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    # In development, include traceback for debugging
    return create_error_response(
        request,
        "INTERNAL_ERROR",
        str(exc),
        status.HTTP_500_INTERNAL_SERVER_ERROR,
        {"traceback": traceback.format_exc()}
    )


def register_error_handlers(app) -> None:
    """Register all error handlers with the FastAPI app."""
    app.add_exception_handler(AppError, app_error_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)