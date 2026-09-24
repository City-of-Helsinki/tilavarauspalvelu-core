from __future__ import annotations

from unittest.mock import patch

import pytest
from django.test import override_settings
from sentry_sdk.integrations.django import DjangoIntegration

from config.settings import Platta, sentry_traces_sampler


def test_sentry_traces_sampler_respects_parent_sampling_decision() -> None:
    assert sentry_traces_sampler({"parent_sampled": True}) == 1.0
    assert sentry_traces_sampler({"parent_sampled": False}) == 0.0


@override_settings(SENTRY_TRACES_SAMPLE_RATE=None, SENTRY_TRACES_IGNORE_PATHS=["/healthz"])
def test_sentry_traces_sampler_disables_sampling_by_default() -> None:
    assert sentry_traces_sampler({"wsgi_environ": {"PATH_INFO": "/api/"}}) == 0.0


@override_settings(SENTRY_TRACES_SAMPLE_RATE=0.25, SENTRY_TRACES_IGNORE_PATHS=["/healthz"])
def test_sentry_traces_sampler_uses_configured_rate() -> None:
    assert sentry_traces_sampler({"wsgi_environ": {"PATH_INFO": "/api/"}}) == 0.25


@pytest.mark.parametrize(
    "path",
    [
        "/healthz",
        "/readiness",
        "/monitoring/liveness/",
        "/monitoring/readiness/",
        "/monitoring/system-status/",
    ],
)
def test_sentry_traces_sampler_excludes_health_checks(path: str) -> None:
    with override_settings(SENTRY_TRACES_SAMPLE_RATE=0.25, SENTRY_TRACES_IGNORE_PATHS=[path]):
        assert sentry_traces_sampler({"wsgi_environ": {"PATH_INFO": path}}) == 0.0


def test_sentry_post_setup_initializes_sdk_with_configured_options() -> None:
    with (
        patch.object(Platta, "SENTRY_DSN", "https://public@example.ingest.sentry.io/1"),
        patch.object(Platta, "SENTRY_ENVIRONMENT", "testing"),
        patch.object(Platta, "SENTRY_RELEASE", "release-123"),
        patch.object(Platta, "SENTRY_TRACES_SAMPLE_RATE", 0.25),
        patch.object(Platta, "SENTRY_PROFILE_SESSION_SAMPLE_RATE", 0.1),
        patch("sentry_sdk.init") as sentry_init,
    ):
        Platta.post_setup()

    sentry_init.assert_called_once()
    options = sentry_init.call_args.kwargs
    assert options["dsn"] == "https://public@example.ingest.sentry.io/1"
    assert options["environment"] == "testing"
    assert options["release"] == "release-123"
    assert options["traces_sampler"] is sentry_traces_sampler
    assert options["profile_session_sample_rate"] == 0.1
    assert options["profile_lifecycle"] == "trace"
    assert len(options["integrations"]) == 1
    assert isinstance(options["integrations"][0], DjangoIntegration)


def test_sentry_post_setup_skips_sdk_initialization_without_dsn() -> None:
    with patch.object(Platta, "SENTRY_DSN", ""), patch("sentry_sdk.init") as sentry_init:
        Platta.post_setup()

    sentry_init.assert_not_called()
