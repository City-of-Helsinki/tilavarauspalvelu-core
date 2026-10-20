from __future__ import annotations

from typing import TYPE_CHECKING

import sentry_sdk
from sentry_sdk.integrations.django import DjangoIntegration

if TYPE_CHECKING:
    from sentry_sdk.types import Event, Hint, SamplingContext


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
        integrations=[DjangoIntegration()],
        traces_sampler=sentry_traces_sampler,
        before_send_transaction=sentry_before_send_transaction,
        profile_session_sample_rate=profile_session_sample_rate,
        profile_lifecycle="trace",
    )


def sentry_traces_sampler(sampling_context: SamplingContext) -> float:
    # Respect a parent sampling decision, as recommended by Sentry.
    if (parent_sampled := sampling_context.get("parent_sampled")) is not None:
        return float(parent_sampled)

    from django.conf import settings

    path = sampling_context.get("wsgi_environ", {}).get("PATH_INFO", "")
    if path in settings.SENTRY_TRACES_IGNORE_PATHS:
        return 0.0

    return settings.SENTRY_TRACES_SAMPLE_RATE or 0.0


def sentry_before_send_transaction(event: Event, _hint: Hint) -> Event:
    # The trace view shows span data, not the request headers of the transaction event.
    # Copy only allowlisted headers, so cookies, CSRF tokens and IP addresses stay out.
    allowed_header_names = ("Accept-Language", "Content-Type", "Origin", "User-Agent")
    request_headers = event.get("request", {}).get("headers", {})
    trace_context = event.setdefault("contexts", {}).setdefault("trace", {})
    trace_data = trace_context.setdefault("data", {})

    for header_name in allowed_header_names:
        header_value = request_headers.get(header_name)
        if header_value is not None:
            trace_data[f"http.request.header.{header_name.lower()}"] = header_value

    return event
