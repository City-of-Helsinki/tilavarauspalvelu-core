from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any
from unittest.mock import patch

import pytest
import sentry_sdk
from celery.exceptions import TimeLimitExceeded, WorkerLostError
from celery.signals import task_failure
from django.db.models.signals import post_init
from django.test import Client, override_settings
from sentry_sdk.integrations.django import DjangoIntegration
from sentry_sdk.integrations.logging import LoggingIntegration
from sentry_sdk.transport import Transport

from config.sentry import init_sentry, sentry_before_send_transaction, sentry_traces_sampler
from config.settings import Common, Docker, Platta
from tilavarauspalvelu.tasks import create_robot_test_data_task

if TYPE_CHECKING:
    from collections.abc import Iterator

    from sentry_sdk.envelope import Envelope

# ── Helpers ──


class EnvelopeCollector(Transport):
    def __init__(self) -> None:
        super().__init__()
        self.envelopes: list[Envelope] = []

    def capture_envelope(self, envelope: Envelope) -> None:
        self.envelopes.append(envelope)

    def sent_transactions(self) -> list[dict[str, Any]]:
        return [
            item.payload.json
            for envelope in self.envelopes
            for item in envelope.items
            if item.type == "transaction" and item.payload.json is not None
        ]

    def sent_events(self) -> list[dict[str, Any]]:
        return [
            item.payload.json
            for envelope in self.envelopes
            for item in envelope.items
            if item.type == "event" and item.payload.json is not None
        ]


@pytest.fixture
def sentry_transport() -> Iterator[EnvelopeCollector]:
    previous_client = sentry_sdk.get_client()
    transport = EnvelopeCollector()
    sentry_sdk.init(
        dsn="https://public@example.ingest.sentry.io/1",
        transport=transport,
        traces_sample_rate=1.0,
        default_integrations=False,
        auto_enabling_integrations=False,
    )
    try:
        yield transport
    finally:
        sentry_sdk.get_global_scope().set_client(previous_client)


def post_graphql_in_transaction(*, body: dict[str, Any]) -> None:
    client = Client()
    with sentry_sdk.start_transaction(name="/graphql/", op="http.server"):
        response = client.post("/graphql/", data=body, content_type="application/json")

    assert response.status_code == 200


# ── Sampling and transaction data ──


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


def test_sentry_before_send_transaction_copies_allowlisted_headers_to_trace_data() -> None:
    event = {
        "request": {
            "headers": {
                "Accept-Language": "fi",
                "Content-Type": "application/json",
                "Cookie": "",
                "Origin": "https://varaamo.hel.fi",
                "User-Agent": "node",
                "X-Csrftoken": "secret-token",
            },
        },
        "contexts": {"trace": {"data": {"http.request.method": "POST"}}},
    }

    result = sentry_before_send_transaction(event, {})

    assert result["contexts"]["trace"]["data"] == {
        "http.request.method": "POST",
        "http.request.header.accept-language": "fi",
        "http.request.header.content-type": "application/json",
        "http.request.header.origin": "https://varaamo.hel.fi",
        "http.request.header.user-agent": "node",
    }


def test_sentry_before_send_transaction_accepts_event_without_request() -> None:
    result = sentry_before_send_transaction({"transaction": "celery-task"}, {})

    assert result == {"transaction": "celery-task", "contexts": {"trace": {"data": {}}}}


@pytest.mark.parametrize("environment", [Docker, Platta])
def test_sentry_post_setup_initializes_sdk_with_configured_options(environment: type[Docker | Platta]) -> None:
    with (
        patch.object(environment, "SENTRY_ENABLED", new=True),
        patch.object(environment, "SENTRY_DSN", "https://public@example.ingest.sentry.io/1"),
        patch.object(environment, "SENTRY_ENVIRONMENT", "testing"),
        patch.object(environment, "SENTRY_RELEASE", "release-123"),
        patch.object(environment, "SENTRY_TRACES_SAMPLE_RATE", 0.25),
        patch.object(environment, "SENTRY_PROFILE_SESSION_SAMPLE_RATE", 0.1),
        patch("sentry_sdk.init") as sentry_init,
    ):
        environment.post_setup()

    sentry_init.assert_called_once()
    options = sentry_init.call_args.kwargs
    assert options["dsn"] == "https://public@example.ingest.sentry.io/1"
    assert options["environment"] == "testing"
    assert options["release"] == "release-123"
    assert options["traces_sampler"] is sentry_traces_sampler
    assert options["before_send_transaction"] is sentry_before_send_transaction
    assert options["profile_session_sample_rate"] == 0.1
    assert options["profile_lifecycle"] == "trace"
    assert len(options["integrations"]) == 1
    assert isinstance(options["integrations"][0], DjangoIntegration)
    assert options["integrations"][0].signals_denylist == [post_init]


@pytest.mark.parametrize("environment", [Docker, Platta])
def test_sentry_post_setup_uses_project_and_semver_of_release_tag_when_release_is_not_configured(
    environment: type[Docker | Platta],
) -> None:
    with (
        patch.object(environment, "SENTRY_ENABLED", new=True),
        patch.object(environment, "SENTRY_DSN", "https://public@example.ingest.sentry.io/1"),
        patch.object(environment, "SENTRY_RELEASE", None),
        patch.object(environment, "SOURCE_BRANCH_NAME", "v1.73.0"),
        patch.object(environment, "SOURCE_VERSION", "0123456789abcdef0123456789abcdef01234567"),
        patch("sentry_sdk.init") as sentry_init,
    ):
        environment.post_setup()

    sentry_init.assert_called_once()
    assert sentry_init.call_args.kwargs["release"] == "tilavarauspalvelu-core@1.73.0"


@pytest.mark.parametrize("environment", [Docker, Platta])
def test_sentry_post_setup_uses_project_and_short_commit_hash_on_main_when_release_is_not_configured(
    environment: type[Docker | Platta],
) -> None:
    with (
        patch.object(environment, "SENTRY_ENABLED", new=True),
        patch.object(environment, "SENTRY_DSN", "https://public@example.ingest.sentry.io/1"),
        patch.object(environment, "SENTRY_RELEASE", None),
        patch.object(environment, "SOURCE_BRANCH_NAME", "main"),
        patch.object(environment, "SOURCE_VERSION", "0123456789abcdef0123456789abcdef01234567"),
        patch("sentry_sdk.init") as sentry_init,
    ):
        environment.post_setup()

    sentry_init.assert_called_once()
    assert sentry_init.call_args.kwargs["release"] == "tilavarauspalvelu-core@01234567"


@pytest.mark.parametrize("environment", [Docker, Platta])
def test_sentry_post_setup_keeps_leading_v_of_branch_name_and_replaces_slashes_when_release_is_not_configured(
    environment: type[Docker | Platta],
) -> None:
    with (
        patch.object(environment, "SENTRY_ENABLED", new=True),
        patch.object(environment, "SENTRY_DSN", "https://public@example.ingest.sentry.io/1"),
        patch.object(environment, "SENTRY_RELEASE", None),
        patch.object(environment, "SOURCE_BRANCH_NAME", "very/new-feature"),
        patch.object(environment, "SOURCE_VERSION", "0123456789abcdef0123456789abcdef01234567"),
        patch("sentry_sdk.init") as sentry_init,
    ):
        environment.post_setup()

    sentry_init.assert_called_once()
    assert sentry_init.call_args.kwargs["release"] == "tilavarauspalvelu-core@very-new-feature"


@pytest.mark.parametrize("environment", [Docker, Platta])
def test_sentry_post_setup_skips_sdk_initialization_without_dsn(environment: type[Docker | Platta]) -> None:
    with (
        patch.object(environment, "SENTRY_ENABLED", new=True),
        patch.object(environment, "SENTRY_DSN", ""),
        patch("sentry_sdk.init") as sentry_init,
    ):
        environment.post_setup()

    sentry_init.assert_not_called()


@pytest.mark.parametrize("environment", [Docker, Platta])
def test_sentry_post_setup_skips_sdk_initialization_when_disabled(environment: type[Docker | Platta]) -> None:
    with (
        patch.object(environment, "SENTRY_ENABLED", new=False),
        patch.object(environment, "SENTRY_DSN", "https://public@example.ingest.sentry.io/1"),
        patch("sentry_sdk.init") as sentry_init,
    ):
        environment.post_setup()

    sentry_init.assert_not_called()


def test_sentry_is_enabled_by_default_only_in_platta_environments() -> None:
    assert Common.SENTRY_ENABLED is False
    assert Platta.SENTRY_ENABLED is True


def test_sentry_init_drops_celery_worker_request_error_logs() -> None:
    with patch("sentry_sdk.init"):
        init_sentry(
            dsn="https://public@example.ingest.sentry.io/1",
            environment="testing",
            release=None,
            profile_session_sample_rate=None,
        )

    previous_client = sentry_sdk.get_client()
    transport = EnvelopeCollector()
    sentry_sdk.init(
        dsn="https://public@example.ingest.sentry.io/1",
        transport=transport,
        default_integrations=False,
        auto_enabling_integrations=False,
        integrations=[LoggingIntegration()],
    )
    try:
        logging.getLogger("celery.worker.request").error("Hard time limit (%ss) exceeded", 300)
        logging.getLogger("tilavarauspalvelu.tasks").error("Task failed")
    finally:
        sentry_sdk.get_global_scope().set_client(previous_client)

    messages = [event["logentry"]["message"] for event in transport.sent_events()]
    assert messages == ["Task failed"]


# ── Celery task failures ──


@pytest.mark.parametrize(
    ("exception", "reason"),
    [
        (TimeLimitExceeded(300), "hard time limit exceeded"),
        (WorkerLostError("Worker exited prematurely: signal 9 (SIGKILL)."), "worker process exited unexpectedly"),
    ],
    ids=["hard-time-limit", "worker-lost"],
)
def test_sentry_reports_killed_celery_task_as_error_grouped_by_task(
    sentry_transport: EnvelopeCollector,
    exception: BaseException,
    reason: str,
) -> None:
    task_failure.send(sender=create_robot_test_data_task, task_id="task-id", exception=exception)

    events = sentry_transport.sent_events()
    assert len(events) == 1
    assert events[0]["level"] == "error"
    assert events[0]["message"] == f"Celery task 'create_robot_test_data' was killed: {reason}"
    assert events[0]["fingerprint"] == ["celery", "killed", "create_robot_test_data", reason]
    assert events[0]["tags"] == {"celery_task_name": "create_robot_test_data"}
    assert events[0]["extra"] == {"celery_task_id": "task-id"}


def test_sentry_does_not_report_celery_task_failure_raised_inside_task(sentry_transport: EnvelopeCollector) -> None:
    task_failure.send(sender=create_robot_test_data_task, task_id="task-id", exception=ValueError("Failed"))

    assert sentry_transport.sent_events() == []


# ── GraphQL view ──


def test_sentry_graphql_view_names_transaction_and_span_with_operation_name(
    sentry_transport: EnvelopeCollector,
) -> None:
    post_graphql_in_transaction(body={"query": "query FrontPage { __typename }", "operationName": "FrontPage"})

    transactions = sentry_transport.sent_transactions()
    assert len(transactions) == 1
    assert transactions[0]["transaction"] == "/graphql/ FrontPage"
    assert transactions[0]["transaction_info"] == {"source": "custom"}

    spans = [
        (span["op"], span["description"], span["data"]["graphql.operation.name"]) for span in transactions[0]["spans"]
    ]
    assert spans == [("graphql.execute", "FrontPage", "FrontPage")]


def test_sentry_graphql_view_reads_operation_name_from_query_without_operation_name(
    sentry_transport: EnvelopeCollector,
) -> None:
    post_graphql_in_transaction(body={"query": "query FrontPage { __typename }"})

    transactions = sentry_transport.sent_transactions()
    assert len(transactions) == 1
    assert transactions[0]["transaction"] == "/graphql/ FrontPage"

    spans = [
        (span["op"], span["description"], span["data"]["graphql.operation.name"]) for span in transactions[0]["spans"]
    ]
    assert spans == [("graphql.execute", "FrontPage", "FrontPage")]


def test_sentry_graphql_view_uses_placeholder_for_anonymous_operation(sentry_transport: EnvelopeCollector) -> None:
    post_graphql_in_transaction(body={"query": "{ __typename }"})

    transactions = sentry_transport.sent_transactions()
    assert len(transactions) == 1
    assert transactions[0]["transaction"] == "/graphql/ <unknown operation>"

    spans = [(span["op"], span["description"]) for span in transactions[0]["spans"]]
    assert spans == [("graphql.execute", "<unknown operation>")]


@pytest.mark.parametrize(
    "query",
    [
        ["{ __typename }"],
        {"query": "{ __typename }"},
        1,
        "{" + "field {" * 3000 + "leaf" + "}" * 3001,
    ],
    ids=["list", "object", "number", "deeply-nested"],
)
def test_sentry_graphql_view_returns_graphql_error_when_query_cannot_be_parsed(
    sentry_transport: EnvelopeCollector,
    query: Any,
) -> None:
    client = Client()
    with sentry_sdk.start_transaction(name="/graphql/", op="http.server"):
        response = client.post("/graphql/", data={"query": query}, content_type="application/json")

    assert response.status_code == 400

    response_body = response.json()
    assert list(response_body) == ["errors"]
    assert len(response_body["errors"]) == 1

    transactions = sentry_transport.sent_transactions()
    assert len(transactions) == 1
    assert transactions[0]["transaction"] == "/graphql/ <unknown operation>"
