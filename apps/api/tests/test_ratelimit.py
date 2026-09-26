"""Tests for rate limiting middleware."""

import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from starlette.requests import Request
from starlette.responses import Response
from starlette.middleware.base import BaseHTTPMiddleware

from app.middleware.ratelimit import RateLimitMiddleware, _rate_limit_store, _clean_old_entries
from app.core.config import settings


@pytest.fixture
def mock_request():
    """Create a mock request."""
    request = MagicMock(spec=Request)
    request.url.path = "/api/v1/pgs"
    request.client.host = "127.0.0.1"
    request.state = MagicMock()
    request.state.user_id = None
    return request


@pytest.fixture(autouse=True)
def clear_rate_limit_store():
    """Clear rate limit store before each test."""
    _rate_limit_store.clear()
    yield
    _rate_limit_store.clear()


class TestRateLimitMiddleware:
    """Test the global rate limiting middleware."""

    @pytest.mark.asyncio
    async def test_allows_requests_under_limit(self, mock_request):
        """Requests under limit should be allowed."""
        middleware = RateLimitMiddleware(AsyncMock())
        
        # Make requests up to the limit
        for i in range(settings.rate_limit_requests):
            mock_request.client.host = f"127.0.0.{i}"
            response = await middleware.dispatch(mock_request, AsyncMock(return_value=Response()))
            assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_blocks_requests_over_limit(self, mock_request):
        """Requests over limit should be blocked with 429."""
        middleware = RateLimitMiddleware(AsyncMock())
        
        # Make requests up to the limit
        for i in range(settings.rate_limit_requests):
            await middleware.dispatch(mock_request, AsyncMock(return_value=Response()))
        
        # Next request should be blocked
        response = await middleware.dispatch(mock_request, AsyncMock(return_value=Response()))
        assert response.status_code == 429

    @pytest.mark.asyncio
    async def test_skips_health_checks(self, mock_request):
        """Health check endpoints should skip rate limiting."""
        mock_request.url.path = "/health"
        middleware = RateLimitMiddleware(AsyncMock())
        
        # Make many requests to health endpoint
        for _ in range(settings.rate_limit_requests + 10):
            response = await middleware.dispatch(mock_request, AsyncMock(return_value=Response()))
            assert response.status_code == 200


class TestCleanOldEntries:
    """Test the _clean_old_entries function."""

    def test_removes_old_entries(self):
        """Should remove entries older than window."""
        import time
        key = "test_key"
        now = time.time()
        
        # Add old and new entries
        _rate_limit_store[key] = [
            now - 120,  # older than 60s window
            now - 30,   # within window
            now - 10,   # within window
        ]
        
        _clean_old_entries(key, 60)
        
        assert len(_rate_limit_store[key]) == 2
        assert all(ts > now - 60 for ts in _rate_limit_store[key])


class TestWriteRateLimit:
    """Test the write rate limit function."""

    @pytest.mark.asyncio
    async def test_new_account_post_limit(self, mock_current_user, mock_supabase):
        """New accounts (< 24h) limited to 3 posts per 24h."""
        from app.middleware.ratelimit import check_write_rate_limit
        from datetime import datetime, timezone, timedelta
        
        with patch('app.middleware.ratelimit.get_supabase_client', return_value=mock_supabase):
            # Mock user created 1 hour ago
            mock_supabase.from_.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value.data = {
                "account_created_at": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
                "women_attested_at": None,
            }
            
            # Mock recent posts count = 3
            mock_supabase.from_.return_value.select.return_value.eq.return_value.gte.return_value.execute.return_value.count = 3
            
            with pytest.raises(Exception) as exc_info:
                await check_write_rate_limit(mock_current_user.user_id, "post")
            
            assert "New accounts limited to 3 posts/comments per 24 hours" in str(exc_info.value)