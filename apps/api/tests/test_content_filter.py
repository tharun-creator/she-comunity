"""Tests for content filter service."""

import pytest
from app.services.content_filter import check_profanity, check_pii, auto_flag_content


class TestProfanityFilter:
    """Test profanity detection."""

    def test_clean_text(self):
        """Clean text should return empty list."""
        assert check_profanity("This is a clean message") == []

    def test_detects_profanity(self):
        """Should detect profanity in text."""
        result = check_profanity("This is a fucking test")
        assert len(result) > 0
        assert any("fuck" in r for r in result)

    def test_case_insensitive(self):
        """Profanity detection should be case insensitive."""
        result = check_profanity("THIS IS A FUCK TEST")
        assert len(result) > 0

    def test_partial_matches(self):
        """Should not match partial words."""
        # "classic" contains "ass" but shouldn't match
        result = check_profanity("This is a classic example")
        # Our pattern uses word boundaries, so "classic" shouldn't match "ass"
        assert not any("ass" in r for r in result)


class TestPIIDetection:
    """Test PII detection."""

    def test_clean_text(self):
        """Clean text should return empty dict."""
        assert check_pii("No PII here") == {}

    def test_detects_phone(self):
        """Should detect Indian phone numbers."""
        result = check_pii("Call me at 9876543210")
        assert "phone" in result
        assert "9876543210" in result["phone"]

    def test_detects_phone_with_country_code(self):
        """Should detect phone with +91."""
        result = check_pii("Call +91 98765 43210")
        assert "phone" in result

    def test_detects_email(self):
        """Should detect email addresses."""
        result = check_pii("Email me at test@example.com")
        assert "email" in result
        assert "test@example.com" in result["email"]

    def test_detects_pincode(self):
        """Should detect 6-digit pincodes."""
        result = check_pii("My pincode is 600001")
        assert "pincode" in result
        assert "600001" in result["pincode"]

    def test_detects_address(self):
        """Should detect addresses with street/road."""
        result = check_pii("I live at 123 Main Street")
        assert "address" in result

    def test_multiple_pii_types(self):
        """Should detect multiple PII types in one text."""
        result = check_pii("Call 9876543210 or email test@example.com, pincode 600001")
        assert "phone" in result
        assert "email" in result
        assert "pincode" in result


class TestAutoFlagContent:
    """Test auto_flag_content function."""

    def test_clean_content(self):
        """Clean content should return None."""
        result = auto_flag_content("This is a clean review about a PG")
        assert result is None

    def test_flags_profanity(self):
        """Content with profanity should be flagged."""
        result = auto_flag_content("This is a fucking bad place")
        assert result is not None
        assert result["flagged"] is True
        assert "harassment" in result["reasons"]
        assert "profanity" in result["flags"]

    def test_flags_pii(self):
        """Content with PII should be flagged."""
        result = auto_flag_content("Contact me at 9876543210 for details")
        assert result is not None
        assert result["flagged"] is True
        assert "doxxing" in result["reasons"]
        assert "pii" in result["flags"]

    def test_flags_both(self):
        """Content with both profanity and PII should flag both."""
        result = auto_flag_content("This fucking place, call 9876543210")
        assert result is not None
        assert "harassment" in result["reasons"]
        assert "doxxing" in result["reasons"]
        assert "profanity" in result["flags"]
        assert "pii" in result["flags"]

    def test_content_preview(self):
        """Flag info should include content preview."""
        long_text = "x" * 300
        result = auto_flag_content(long_text)
        assert result is not None
        assert len(result["content_preview"]) <= 200