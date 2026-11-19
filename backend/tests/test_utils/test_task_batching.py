from __future__ import annotations

from unittest import mock

import pytest
from django.db import transaction

from config.celery import app
from utils.task_batching import delay_on_commit_batched

pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──────────────────────────────────────────────────────────────────


@app.task(name="test_task_batching")
def batched_task(pks: list[int], mode: str = "") -> None:
    pass


# ── Batching ─────────────────────────────────────────────────────────────────


@mock.patch.object(batched_task, "apply_async")
def test_delay_on_commit_batched__one_task_for_one_transaction(mock_apply_async, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        delay_on_commit_batched(batched_task, database="default", pks=[3, 1])
        delay_on_commit_batched(batched_task, database="default", pks=[1, 2])

        assert mock_apply_async.call_count == 0

    assert mock_apply_async.call_args_list == [mock.call(kwargs={"pks": [1, 2, 3]})]


@mock.patch.object(batched_task, "apply_async")
def test_delay_on_commit_batched__one_task_for_each_transaction(mock_apply_async, django_capture_on_commit_callbacks):
    with django_capture_on_commit_callbacks(execute=True):
        delay_on_commit_batched(batched_task, database="default", pks=[1])

    with django_capture_on_commit_callbacks(execute=True):
        delay_on_commit_batched(batched_task, database="default", pks=[2])

    assert mock_apply_async.call_args_list == [
        mock.call(kwargs={"pks": [1]}),
        mock.call(kwargs={"pks": [2]}),
    ]


@mock.patch.object(batched_task, "apply_async")
def test_delay_on_commit_batched__one_task_for_each_value_of_other_arguments(
    mock_apply_async, django_capture_on_commit_callbacks
):
    with django_capture_on_commit_callbacks(execute=True):
        delay_on_commit_batched(batched_task, database="default", pks=[1], mode="first")
        delay_on_commit_batched(batched_task, database="default", pks=[2], mode="second")
        delay_on_commit_batched(batched_task, database="default", pks=[3], mode="first")

    assert mock_apply_async.call_args_list == [
        mock.call(kwargs={"mode": "first", "pks": [1, 3]}),
        mock.call(kwargs={"mode": "second", "pks": [2]}),
    ]


# ── Rollbacks ────────────────────────────────────────────────────────────────


@mock.patch.object(batched_task, "apply_async")
def test_delay_on_commit_batched__no_task_for_rolled_back_transaction(
    mock_apply_async, django_capture_on_commit_callbacks
):
    with transaction.atomic():
        delay_on_commit_batched(batched_task, database="default", pks=[1])
        transaction.set_rollback(True)

    with django_capture_on_commit_callbacks(execute=True):
        delay_on_commit_batched(batched_task, database="default", pks=[2])

    assert mock_apply_async.call_args_list == [mock.call(kwargs={"pks": [2]})]
