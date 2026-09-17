"""SheStays Community API — Production-ready FastAPI backend."""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.middleware.errors import register_error_handlers, AppError
from app.middleware.logging import StructuredLoggingMiddleware
from app.middleware.ratelimit import RateLimitMiddleware
from app.routers import pg, post, comment, vote, report, notification, user, health


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"Starting SheStays API in {settings.app_env} mode")
    yield
    # Shutdown
    print("Shutting down SheStays API")


app = FastAPI(
    title="SheStays Community API",
    version="1.0.0",
    docs_url="/docs" if settings.app_env != "production" else None,
    redoc_url="/redoc" if settings.app_env != "production" else None,
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Custom middleware (order matters - outer to inner)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(RateLimitMiddleware)

# Register error handlers
register_error_handlers(app)

# Include routers
app.include_router(health.router, prefix="/api/v1", tags=["health"])
app.include_router(pg.router, prefix="/api/v1", tags=["pgs"])
app.include_router(post.router, prefix="/api/v1", tags=["posts"])
app.include_router(comment.router, prefix="/api/v1", tags=["comments"])
app.include_router(vote.router, prefix="/api/v1", tags=["votes"])
app.include_router(report.router, prefix="/api/v1", tags=["reports"])
app.include_router(notification.router, prefix="/api/v1", tags=["notifications"])
app.include_router(user.router, prefix="/api/v1", tags=["users"])


@app.exception_handler(AppError)
async def global_app_error_handler(request: Request, exc: AppError):
    """Global handler for AppError exceptions."""
    from app.middleware.errors import create_error_response
    return create_error_response(request, exc.error_code, exc.message, exc.status_code, exc.details)


@app.get("/")
async def root():
    return {
        "name": "SheStays Community API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/v1/health"
    }