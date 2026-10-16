from __future__ import annotations

from typing import TYPE_CHECKING

from config.celery import app
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.tasks import singleton_task

from tests.helpers import patch_method

if TYPE_CHECKING:
    from collections.abc import Callable

# ── Helpers ──

calls: list[tuple[str, str]] = []
calls_to_make_while_locked: list[Callable[[], None]] = []


@singleton_task
@app.task(name="test_singleton_task")
def run_other_while_locked_task(first: str, second: str = "") -> None:
    calls.append((first, second))

    if calls_to_make_while_locked:
        call_to_make = calls_to_make_while_locked.pop()
        call_to_make()


# ── Locking ──


@patch_method(SentryLogger.log_message)
def test_singleton_task__runs_with_other_arguments_while_locked():
    calls.clear()
    calls_to_make_while_locked[:] = [lambda: run_other_while_locked_task("2")]

    run_other_while_locked_task("1")

    assert calls == [("1", ""), ("2", "")]


@patch_method(SentryLogger.log_message)
def test_singleton_task__runs_with_arguments_that_join_to_the_same_text_while_locked():
    calls.clear()
    calls_to_make_while_locked[:] = [lambda: run_other_while_locked_task("a", "b:c")]

    run_other_while_locked_task("a:b", "c")

    assert calls == [("a:b", "c"), ("a", "b:c")]


@patch_method(SentryLogger.log_message)
def test_singleton_task__skips_same_arguments_while_locked():
    calls.clear()
    calls_to_make_while_locked[:] = [lambda: run_other_while_locked_task("1")]

    run_other_while_locked_task("1")

    assert calls == [("1", "")]
    assert SentryLogger.log_message.call_count == 1


@patch_method(SentryLogger.log_message)
def test_singleton_task__skips_same_arguments_given_by_keyword_or_default_while_locked():
    calls.clear()
    calls_to_make_while_locked[:] = [lambda: run_other_while_locked_task(first="1", second="")]

    run_other_while_locked_task("1")

    assert calls == [("1", "")]
    assert SentryLogger.log_message.call_count == 1
