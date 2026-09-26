import logging
import json
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

# Configure structured logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(message)s"
)

logger = logging.getLogger("she-stays-api")


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for structured JSON logging with request IDs."""

    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Start timer
        start_time = time.time()

        # Log request
        logger.info(json.dumps({
            "event": "request_start",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "client_ip": request.client.host if request.client else None,
            "user_agent": request.headers.get("user-agent"),
        }))

        # Process request
        try:
            response = await call_next(request)
        except Exception as exc:
            # Log exception
            process_time = time.time() - start_time
            logger.error(json.dumps({
                "event": "request_error",
                "request_id": request_id,
                "method": request.method,
                "path": request.url.path,
                "process_time_ms": round(process_time * 1000, 2),
                "error": str(exc),
                "error_type": type(exc).__name__,
            }), exc_info=True)
            raise

        # Log response
        process_time = time.time() - start_time
        logger.info(json.dumps({
            "event": "request_complete",
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "process_time_ms": round(process_time * 1000, 2),
        }))

        # Add request ID to response headers
        response.headers["X-Request-ID"] = request_id
        return response


def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name."""
    return logging.getLogger(f"she-stays-api.{name}")