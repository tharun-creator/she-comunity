"""Tests for serializers, formatting helpers, and router data conversions."""

import pytest
from uuid import uuid4
from datetime import datetime, timezone

from app.routers.pg import format_pg_dict
from app.routers.post import format_post
from app.routers.comment import format_comment
from app.schemas.user import UserProfile
from app.schemas.post import PostResponse
from app.schemas.comment import CommentResponse, CommentThreadNode
from app.schemas.notification import NotificationResponse
from app.middleware.auth import CurrentUser


class TestPGFormatting:
    def test_format_pg_dict_with_nested_stats_list(self):
        pg_id = str(uuid4())
        raw_pg = {
            "id": pg_id,
            "name": "Lotus Ladies PG",
            "area": "Velachery",
            "address": "10 Main Rd",
            "cover_image_url": None,
            "founding_user_id": str(uuid4()),
            "created_at": datetime.now(timezone.utc).isoformat(),
            "pg_stats": [
                {
                    "member_count": 4,
                    "review_count": 2,
                    "aggregate_rating": 4.5,
                    "tag_averages": {"Safety": 4.5},
                }
            ],
        }

        formatted = format_pg_dict(raw_pg)
        assert formatted["member_count"] == 4
        assert formatted["review_count"] == 2
        assert formatted["aggregate_rating"] == 4.5
        assert formatted["is_publicly_visible"] is True

    def test_format_pg_dict_thresholds(self):
        # Case 1: Not visible (<3 members and <5 reviews)
        raw_hidden = {
            "id": str(uuid4()),
            "name": "Hidden PG",
            "pg_stats": [{"member_count": 2, "review_count": 4}],
        }
        res_hidden = format_pg_dict(raw_hidden)
        assert res_hidden["is_publicly_visible"] is False

        # Case 2: Visible via review threshold
        raw_visible_reviews = {
            "id": str(uuid4()),
            "name": "Review PG",
            "pg_stats": [{"member_count": 1, "review_count": 5}],
        }
        res_reviews = format_pg_dict(raw_visible_reviews)
        assert res_reviews["is_publicly_visible"] is True


class TestPostFormatting:
    def test_format_anonymous_post(self):
        raw_post = {
            "id": str(uuid4()),
            "pg_id": str(uuid4()),
            "type": "review",
            "title": "Quiet stay",
            "body": "Good environment for studies.",
            "is_anonymous": True,
            "author_id": str(uuid4()),
            "author_display_name": "Secret User",
            "author_avatar_url": "https://example.com/avatar.jpg",
            "residency_claim": "stayed_here",
            "rating_tags": {"Safety": 5},
            "overall_rating": 4.5,
            "poll_options": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "upvotes": 3,
            "downvotes": 0,
            "comment_count": 1,
        }

        formatted = format_post(raw_post)
        assert formatted["author"]["is_anonymous"] is True
        assert formatted["author"]["display_name"] is None
        assert formatted["author"]["avatar_url"] is None
        assert formatted["author"]["anonymous_tag"] == "Anonymous Resident"

        # Verify validates through Pydantic
        post_obj = PostResponse(**formatted)
        assert post_obj.author.is_anonymous is True
        assert post_obj.author.display_name is None
        assert post_obj.author.anonymous_tag == "Anonymous Resident"

    def test_format_named_post(self):
        raw_post = {
            "id": str(uuid4()),
            "pg_id": str(uuid4()),
            "type": "discussion",
            "title": "Internet speed?",
            "body": "What is the average WiFi speed?",
            "is_anonymous": False,
            "author_id": str(uuid4()),
            "author_display_name": "Sneha R",
            "author_avatar_url": "https://example.com/sneha.jpg",
            "residency_claim": None,
            "rating_tags": None,
            "overall_rating": None,
            "poll_options": None,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "upvotes": 5,
            "downvotes": 1,
            "comment_count": 2,
        }

        formatted = format_post(raw_post)
        assert formatted["author"]["display_name"] == "Sneha R"
        assert formatted["author"]["avatar_url"] == "https://example.com/sneha.jpg"

        post_obj = PostResponse(**formatted)
        assert post_obj.author.display_name == "Sneha R"


class TestCommentFormatting:
    def test_format_comment_tree(self):
        raw_comment = {
            "id": str(uuid4()),
            "post_id": str(uuid4()),
            "parent_comment_id": None,
            "is_anonymous": False,
            "author_display_name": "Pooja M",
            "author_avatar_url": None,
            "body": "Top level reply",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "upvotes": 2,
            "downvotes": 0,
            "replies": [
                {
                    "id": str(uuid4()),
                    "post_id": str(uuid4()),
                    "parent_comment_id": str(uuid4()),
                    "is_anonymous": True,
                    "author_display_name": "Pooja M",
                    "author_avatar_url": None,
                    "body": "Anonymous nested reply",
                    "created_at": datetime.now(timezone.utc).isoformat(),
                    "upvotes": 0,
                    "downvotes": 0,
                }
            ],
        }

        formatted = format_comment(raw_comment)
        assert formatted["author"]["display_name"] == "Pooja M"
        assert formatted["author"]["is_anonymous"] is False
        assert formatted["replies"][0]["author"]["is_anonymous"] is True
        assert formatted["replies"][0]["author"]["display_name"] is None
        assert formatted["replies"][0]["author"]["anonymous_tag"] == "Anonymous Resident"

        comment_obj = CommentThreadNode(**formatted)
        assert comment_obj.author.display_name == "Pooja M"
        assert comment_obj.replies[0].author.is_anonymous is True
        assert comment_obj.replies[0].author.display_name is None


class TestUserProfileSchema:
    def test_profile_with_account_created_at(self):
        now_str = datetime.now(timezone.utc).isoformat()
        profile_data = {
            "id": uuid4(),
            "display_name": "Ananya",
            "city": "Chennai",
            "avatar_url": None,
            "phone_verified": True,
            "women_attested": True,
            "joined_pg_ids": [uuid4()],
            "account_created_at": now_str,
        }
        profile = UserProfile(**profile_data)
        assert profile.created_at is not None
        assert profile.display_name == "Ananya"


class TestNotificationSchema:
    def test_notification_with_nullable_targets(self):
        notif_data = {
            "id": uuid4(),
            "type": "upvote",
            "pg_id": None,
            "post_id": None,
            "pg_name": None,
            "post_excerpt": "Great stay!",
            "was_anonymous": False,
            "is_read": False,
            "created_at": datetime.now(timezone.utc),
        }
        notif = NotificationResponse(**notif_data)
        assert notif.type == "upvote"
        assert notif.pg_id is None


class TestCurrentUserModel:
    def test_current_user_id_aliases(self):
        uid = str(uuid4())
        auth_uid = str(uuid4())
        user = CurrentUser(user_id=uid, email="test@example.com", auth_user_id=auth_uid)
        assert user.user_id == uid
        assert user.id == uid
        assert user.auth_user_id == auth_uid
