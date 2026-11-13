from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING
from unittest import mock

import pytest

from config.celery import app
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.tasks import singleton_task

from tests.helpers import as_mock, patch_method

if TYPE_CHECKING:
    from collections.abc import Callable

    from pytest_django import Settings

# ── Helpers ──


@dataclasses.dataclass
class TaskRuns:
    calls: list[tuple[str, str]] = dataclasses.field(default_factory=list)
    calls_to_make_while_locked: list[Callable[[], None]] = dataclasses.field(default_factory=list)


task_runs = TaskRuns()


@singleton_task
@app.task(name="test_singleton_task")
def run_other_while_locked_task(first: str, second: str = "") -> None:
    task_runs.calls.append((first, second))

    if task_runs.calls_to_make_while_locked:
        call_to_make = task_runs.calls_to_make_while_locked.pop()
        call_to_make()


@singleton_task
@app.task(name="test_singleton_task_with_time_limit", time_limit=1800)
def run_with_time_limit_task(first: str) -> None:
    task_runs.calls.append((first, ""))


@pytest.fixture
def runs() -> TaskRuns:
    task_runs.calls.clear()
    task_runs.calls_to_make_while_locked.clear()
    return task_runs


# ── Locking ──


@patch_method(SentryLogger.log_message)
def test_singleton_task__runs_with_other_arguments_while_locked(runs: TaskRuns) -> None:
    runs.calls_to_make_while_locked.append(lambda: run_other_while_locked_task("2"))

    run_other_while_locked_task("1")

    assert runs.calls == [("1", ""), ("2", "")]
    assert as_mock(SentryLogger.log_message).call_count == 0


@patch_method(SentryLogger.log_message)
def test_singleton_task__runs_with_arguments_that_join_to_the_same_text_while_locked(runs: TaskRuns) -> None:
    runs.calls_to_make_while_locked.append(lambda: run_other_while_locked_task("a", "b:c"))

    run_other_while_locked_task("a:b", "c")

    assert runs.calls == [("a:b", "c"), ("a", "b:c")]
    assert as_mock(SentryLogger.log_message).call_count == 0


@patch_method(SentryLogger.log_message)
def test_singleton_task__skips_same_arguments_while_locked(runs: TaskRuns) -> None:
    runs.calls_to_make_while_locked.append(lambda: run_other_while_locked_task("1"))

    run_other_while_locked_task("1")

    assert runs.calls == [("1", "")]
    assert as_mock(SentryLogger.log_message).call_count == 1
    assert as_mock(SentryLogger.log_message).call_args.args == ()
    assert as_mock(SentryLogger.log_message).call_args.kwargs == {
        "message": "Task skipped since another instance is already running.",
        "details": {"task_name": "test_singleton_task"},
    }


@patch_method(SentryLogger.log_message)
def test_singleton_task__skips_same_arguments_given_by_keyword_or_default_while_locked(runs: TaskRuns) -> None:
    runs.calls_to_make_while_locked.append(lambda: run_other_while_locked_task(first="1", second=""))

    run_other_while_locked_task("1")

    assert runs.calls == [("1", "")]
    assert as_mock(SentryLogger.log_message).call_count == 1


# ── Lock time ──


@mock.patch("tilavarauspalvelu.tasks.cache")
def test_singleton_task__locks_for_the_default_time_limit(
    mock_cache: mock.MagicMock, runs: TaskRuns, settings: Settings
) -> None:
    settings.CELERY_TASK_TIME_LIMIT = 600

    run_other_while_locked_task("1")

    assert mock_cache.add.call_args == mock.call('test_singleton_task:{"first":"1","second":""}', 1, 600)


@mock.patch("tilavarauspalvelu.tasks.cache")
def test_singleton_task__locks_for_the_time_limit_of_the_task(
    mock_cache: mock.MagicMock, runs: TaskRuns, settings: Settings
) -> None:
    settings.CELERY_TASK_TIME_LIMIT = 600

    run_with_time_limit_task("1")

    assert mock_cache.add.call_args == mock.call('test_singleton_task_with_time_limit:{"first":"1"}', 1, 1800)
