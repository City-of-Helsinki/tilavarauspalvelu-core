from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import sentry_sdk
from django.db.models.signals import post_init
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration, ignore_logger_for_events

if TYPE_CHECKING:
    from sentry_sdk.types import SamplingContext


def init_sentry(
    *,
    dsn: str,
    environment: str,
    release: str | None,
    profile_session_sample_rate: float | None,
) -> None:
    sentry_sdk.init(
        dsn=dsn,
        environment=environment,
        release=release,
        integrations=[
            # modeltranslation connects 'delete_mt_init' to 'post_init', which fires for every loaded
            # model instance. Each call becomes a span, and these spans fill the trace.
            DjangoIntegration(signals_denylist=[post_init]),
            # Report error logs as issues. Do not send Sentry Logs.
            LoggingIntegration(level=None, event_level=logging.ERROR, breadcrumb_level=logging.INFO),
        ],
        traces_sampler=sentry_traces_sampler,
        # The SDK defaults collect personal data, such as IP addresses, request bodies and GraphQL variables.
        data_collection={
            "user_info": False,
            "cookies": {"mode": "off"},
            "http_headers": {
                "request": {
                    "mode": "allowlist",
                    "terms": ["Accept-Language", "Content-Type", "Origin", "User-Agent"],
                },
            },
            "http_bodies": [],
            "url_query_params": {"mode": "off"},
            "graphql": {"document": True, "variables": False},
            "database_query_data": False,
            "queues": False,
        },
        profile_session_sample_rate=profile_session_sample_rate,
        profile_lifecycle="trace",
    )

    # The worker logs hard time limits and lost worker processes here without the task scope,
    # so Sentry groups them into one issue. 'tilavarauspalvelu.signals' reports them per task instead.
    ignore_logger_for_events("celery.worker.request")


def sentry_traces_sampler(sampling_context: SamplingContext) -> float:
    # Respect a parent sampling decision, as recommended by Sentry.
    if (parent_sampled := sampling_context.get("parent_sampled")) is not None:
        return float(parent_sampled)

    from django.conf import settings

    path = sampling_context.get("wsgi_environ", {}).get("PATH_INFO", "")
    if path in settings.SENTRY_TRACES_IGNORE_PATHS:
        return 0.0

    return settings.SENTRY_TRACES_SAMPLE_RATE or 0.0
