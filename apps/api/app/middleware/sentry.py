"""Sentry integration for error tracking."""

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from app.core.config import settings


def init_sentry():
    """Initialize Sentry SDK."""
    if not settings.sentry_dsn:
        return

    sentry_logging = LoggingIntegration(
        level=None,  # Capture all levels
        event_level=None,  # Send all events
    )

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        integrations=[
            FastApiIntegration(transaction_style="endpoint"),
            StarletteIntegration(transaction_style="endpoint"),
            sentry_logging,
        ],
        environment=settings.app_env,
        traces_sample_rate=0.1,
        profiles_sample_rate=0.1,
        send_default_pii=False,
        max_breadcrumbs=50,
        attach_stacktrace=True,
    )