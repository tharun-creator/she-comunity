"""Pytest configuration and fixtures for SheStays API tests."""

import pytest
from unittest.mock import AsyncMock, MagicMock
from fastapi.testclient import TestClient
from uuid import uuid4

# Mock Supabase client
@pytest.fixture
def mock_supabase():
    """Create a mock Supabase client."""
    mock = MagicMock()
    mock.from_ = MagicMock(return_value=mock)
    mock.select = MagicMock(return_value=mock)
    mock.eq = MagicMock(return_value=mock)
    mock.ilike = MagicMock(return_value=mock)
    mock.order = MagicMock(return_value=mock)
    mock.limit = MagicMock(return_value=mock)
    mock.lt = MagicMock(return_value=mock)
    mock.single = MagicMock(return_value=mock)
    mock.execute = MagicMock(return_value=MagicMock(data=[], error=None))
    mock.insert = MagicMock(return_value=mock)
    mock.update = MagicMock(return_value=mock)
    mock.delete = MagicMock(return_value=mock)
    mock.rpc = MagicMock(return_value=mock)
    mock.is_ = MagicMock(return_value=mock)
    mock.not_ = MagicMock(return_value=mock)
    mock.or_ = MagicMock(return_value=mock)
    mock.text_search = MagicMock(return_value=mock)
    mock.gte = MagicMock(return_value=mock)
    mock.count = MagicMock(return_value=mock)
    return mock

@pytest.fixture
def mock_current_user():
    """Create a mock current user."""
    user = MagicMock()
    user.user_id = str(uuid4())
    return user

@pytest.fixture
def sample_pg_data():
    """Sample PG data for testing."""
    return {
        "id": str(uuid4()),
        "name": "Test PG",
        "area": "OMR-Sholinganallur",
        "address": "123 Test Street",
        "founding_user_id": str(uuid4()),
        "member_count": 5,
        "review_count": 3,
        "aggregate_rating": 4.5,
        "tag_averages": {"Safety": 4.0, "Food": 3.5},
        "is_publicly_visible": True,
        "created_at": "2024-01-01T00:00:00Z",
    }

@pytest.fixture
def sample_post_data():
    """Sample post data for testing."""
    return {
        "id": str(uuid4()),
        "pg_id": str(uuid4()),
        "author_id": str(uuid4()),
        "is_anonymous": False,
        "type": "review",
        "title": "Great PG!",
        "body": "Really enjoyed my stay here.",
        "residency_claim": "currently_here",
        "rating_tags": {"Safety": 5, "Food": 4},
        "overall_rating": 4.5,
        "poll_options": None,
        "topics": ["food", "safety"],
        "image_url": None,
        "link_url": None,
        "is_removed": False,
        "created_at": "2024-01-01T00:00:00Z",
    }

@pytest.fixture
def sample_user_data():
    """Sample user data for testing."""
    return {
        "id": str(uuid4()),
        "auth_user_id": str(uuid4()),
        "display_name": "Test User",
        "city": "Chennai",
        "avatar_url": None,
        "phone_verified_at": "2024-01-01T00:00:00Z",
        "women_attested_at": "2024-01-01T00:00:00Z",
        "banned_at": None,
        "created_at": "2024-01-01T00:00:00Z",
    }