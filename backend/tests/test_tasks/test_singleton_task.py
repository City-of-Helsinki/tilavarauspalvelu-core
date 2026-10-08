from __future__ import annotations

from config.celery import app
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.tasks import singleton_task

from tests.helpers import patch_method

# ── Helpers ──

calls: list[int] = []
values_to_run_while_locked: list[int] = []


@singleton_task
@app.task(name="test_singleton_task")
def run_other_while_locked_task(value: int) -> None:
    calls.append(value)

    if values_to_run_while_locked:
        run_other_while_locked_task(values_to_run_while_locked.pop())


# ── Locking ──


@patch_method(SentryLogger.log_message)
def test_singleton_task__runs_with_other_arguments_while_locked():
    calls.clear()
    values_to_run_while_locked[:] = [2]

    run_other_while_locked_task(1)

    assert calls == [1, 2]


@patch_method(SentryLogger.log_message)
def test_singleton_task__skips_same_arguments_while_locked():
    calls.clear()
    values_to_run_while_locked[:] = [1]

    run_other_while_locked_task(1)

    assert calls == [1]
    assert SentryLogger.log_message.call_count == 1
