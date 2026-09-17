"""Automated content filtering for profanity and PII detection."""

import re
import logging
from typing import Optional
from app.deps.supabase import get_supabase_client

logger = logging.getLogger("she-stays-api.content-filter")

# Profanity patterns (basic - replace with proper library in production)
PROFANITY_PATTERNS = [
    r'\b(fuck|shit|bitch|asshole|bastard|cunt|dick|pussy|whore|slut)\b',
    # Add more as needed - in production use a library like better-profanity
]

# PII patterns
PII_PATTERNS = {
    "phone": r'(\+?91[\s-]?)?[6-9]\d{9}',  # Indian phone numbers
    "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
    "address": r'\b\d{1,5}\s+[A-Za-z\s]+(?:street|st|road|rd|avenue|ave|lane|ln|drive|dr|court|ct|circle|cir|boulevard|blvd)\b',
    "pincode": r'\b\d{6}\b',  # Indian pincodes
}

# Compile patterns
COMPILED_PROFANITY = [re.compile(p, re.IGNORECASE) for p in PROFANITY_PATTERNS]
COMPILED_PII = {k: re.compile(v, re.IGNORECASE) for k, v in PII_PATTERNS.items()}


def check_profanity(text: str) -> list[str]:
    """Check text for profanity. Returns list of matched patterns."""
    matches = []
    for pattern in COMPILED_PROFANITY:
        if pattern.search(text):
            matches.append(pattern.pattern)
    return matches


def check_pii(text: str) -> dict[str, list[str]]:
    """Check text for PII. Returns dict of pii_type -> matches."""
    matches = {}
    for pii_type, pattern in COMPILED_PII.items():
        found = pattern.findall(text)
        if found:
            matches[pii_type] = found
    return matches


def auto_flag_content(text: str, content_type: str = "post") -> Optional[dict]:
    """
    Check content for violations and return flag info if found.
    Returns None if clean, dict with flag info if violations found.
    """
    flags = {}

    # Check profanity
    profanity_matches = check_profanity(text)
    if profanity_matches:
        flags["profanity"] = profanity_matches

    # Check PII
    pii_matches = check_pii(text)
    if pii_matches:
        flags["pii"] = pii_matches

    if not flags:
        return None

    # Determine reason based on flags
    reasons = []
    if "profanity" in flags:
        reasons.append("harassment")
    if "pii" in flags:
        reasons.append("doxxing")

    return {
        "flagged": True,
        "reasons": list(set(reasons)),
        "flags": flags,
        "content_preview": text[:200],
    }


async def create_auto_flag_report(
    target_type: str,
    target_id: str,
    author_id: str,
    flag_info: dict,
    supabase_client=None
) -> Optional[str]:
    """Create an automatic flag report for moderation review."""
    if not supabase_client:
        supabase_client = get_supabase_client()

    # Don't auto-flag if already flagged
    existing = supabase_client.from_("reports").select("id").eq("target_type", target_type).eq("target_id", target_id).eq("reason", flag_info["reasons"][0]).execute()
    if existing.data:
        return None

    # Create report with system flagger
    system_user = supabase_client.from_("users").select("id").eq("is_staff", True).limit(1).execute()
    if not system_user.data:
        logger.warning("No system user found for auto-flag")
        return None

    reporter_id = system_user.data[0]["id"]

    detail = f"Auto-flagged by content filter. Flags: {flag_info['flags']}"

    result = supabase_client.from_("reports").insert({
        "reporter_id": reporter_id,
        "target_type": target_type,
        "target_id": target_id,
        "reason": flag_info["reasons"][0],
        "detail": detail,
    }).select().single()

    if result.error:
        logger.error(f"Failed to create auto-flag report: {result.error}")
        return None

    logger.info(f"Auto-flagged {target_type} {target_id}: {flag_info['reasons']}")
    return result.data["id"]