"""Tests for upload router presigned URL generation."""

import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.middleware.auth import get_current_user, CurrentUser


@pytest.fixture
def mock_current_user():
    return CurrentUser(
        user_id="11111111-1111-1111-1111-111111111111",
        email="testuser@example.com"
    )


def test_presigned_url_valid_image(mock_current_user):
    """Test generating a presigned URL for a valid image type."""
    from main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user
    client = TestClient(app)

    response = client.post(
        "/api/v1/uploads/presigned-url",
        json={
            "file_name": "room_photo.jpg",
            "file_type": "image/jpeg",
            "folder": "pg-reviews"
        }
    )

    app.dependency_overrides.clear()

    assert response.status_code == 200
    data = response.json()
    assert "upload_url" in data
    assert "public_url" in data
    assert "file_key" in data
    assert "pg-reviews/11111111-1111-1111-1111-111111111111/" in data["file_key"]


def test_presigned_url_invalid_file_type(mock_current_user):
    """Test generating a presigned URL with an unallowed MIME type."""
    from main import app

    app.dependency_overrides[get_current_user] = lambda: mock_current_user
    client = TestClient(app)

    response = client.post(
        "/api/v1/uploads/presigned-url",
        json={
            "file_name": "malicious.exe",
            "file_type": "application/x-msdownload",
            "folder": "pg-reviews"
        }
    )

    app.dependency_overrides.clear()

    assert response.status_code == 400
    assert "Invalid file type" in response.text
