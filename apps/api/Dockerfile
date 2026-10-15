# SheStays Community Backend — FastAPI Development Dockerfile
# Multi-stage build using pip for dependency management

# Base stage with Python
FROM python:3.12-alpine AS base
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client

# Configure Python
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Create virtual environment in project directory
RUN python -m venv .venv

# Copy dependency files
COPY requirements.txt ./

# Install dependencies into .venv
RUN .venv/bin/pip install --upgrade pip && \
    .venv/bin/pip install -r requirements.txt

# Development stage with hot reload
FROM base AS development
ENV APP_ENV=development

# Copy application code
COPY . .

EXPOSE 8000

ENTRYPOINT ["dumb-init", "--"]

# Start development server with hot reload
CMD [".venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Production builder stage - inherits .venv from base
FROM base AS builder
ENV APP_ENV=production

# Copy application code
COPY . .

# Production runner stage
FROM python:3.12-alpine AS runner
WORKDIR /app

ENV APP_ENV=production \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Install runtime dependencies only
RUN apk add --no-cache \
    dumb-init \
    libpq \
    curl

# Copy virtual environment from base (has all dependencies)
COPY --from=base /app/.venv .venv

# Copy application code from builder
COPY --from=builder /app .

# Create non-root user
RUN addgroup --system --gid 1000 appuser && \
    adduser --system --uid 1000 --ingroup appuser appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 8000

ENTRYPOINT ["dumb-init", "--"]

# Start production server
CMD [".venv/bin/uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]