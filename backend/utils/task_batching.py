from __future__ import annotations

from dataclasses import dataclass, field
from typing import TYPE_CHECKING, Any
from weakref import WeakKeyDictionary

from django.db import transaction

if TYPE_CHECKING:
    from collections.abc import Hashable

    from celery import Task
    from django.db.backends.base.base import BaseDatabaseWrapper


__all__ = [
    "delay_on_commit_batched",
]


def delay_on_commit_batched(task: Task, /, *, database: str | None, **arguments: Any) -> None:
    """
    Start the task once when the transaction on the database commits, for all calls in the transaction.

    List arguments of the calls are merged into one sorted list without duplicates.
    Calls with different values in the other arguments start separate tasks.
    Outside a transaction, the task starts at once.

    Use this in signal receivers. Bulk writes send a signal for each row,
    and one task for each row would start thousands of tasks.
    """
    connection = transaction.get_connection(database)
    batches = _task_batches.setdefault(connection, {})

    list_arguments = {name: value for name, value in arguments.items() if isinstance(value, list)}
    other_arguments = {name: value for name, value in arguments.items() if not isinstance(value, list)}
    batch_key = _TaskBatchKey(
        task_name=task.name,
        list_argument_names=frozenset(list_arguments),
        other_arguments=frozenset(other_arguments.items()),
    )

    # A rollback removes the callback of the batch from the connection. The next call then starts a new batch.
    # A call in a rolled back savepoint can stay in the batch of the outer transaction.
    # So the task must accept values for rows that no longer exist or that the savepoint did not change.
    # 'connection.run_on_commit' is a Django internal. Its tuple shape can change in a Django upgrade.
    registered_callbacks = [callback for _, callback, _ in connection.run_on_commit]
    batch = batches.get(batch_key)
    if batch is not None and not batch.task_started and batch.start_task in registered_callbacks:
        batch.add_list_arguments(list_arguments)
        return

    batch = _TaskBatch(task=task, other_arguments=other_arguments)
    batch.add_list_arguments(list_arguments)
    batches[batch_key] = batch

    # Outside a transaction, 'on_commit' runs the callback at once. So add the arguments before this.
    transaction.on_commit(batch.start_task, using=database)


# Internals


@dataclass(frozen=True)
class _TaskBatchKey:
    task_name: str | None
    list_argument_names: frozenset[str]
    other_arguments: frozenset[tuple[str, Hashable]]


@dataclass
class _TaskBatch:
    task: Task
    other_arguments: dict[str, Any]
    list_arguments: dict[str, set[Any]] = field(default_factory=dict)

    # Test helpers like 'captureOnCommitCallbacks(execute=True)' run the callbacks but leave them in
    # 'connection.run_on_commit'. Without this flag, a later call in the same test joins a batch that already ran.
    task_started: bool = False

    def add_list_arguments(self, list_arguments: dict[str, list[Any]]) -> None:
        for name, values in list_arguments.items():
            self.list_arguments.setdefault(name, set()).update(values)

    def start_task(self) -> None:
        self.task_started = True

        sorted_list_arguments = {name: sorted(values) for name, values in self.list_arguments.items()}
        # The argument names come from the caller, so this generic helper must pass them to the task as a dict.
        task_arguments = self.other_arguments | sorted_list_arguments
        self.task.apply_async(kwargs=task_arguments)


# The task batches of the current transaction, for each database connection.
_task_batches: WeakKeyDictionary[BaseDatabaseWrapper, dict[_TaskBatchKey, _TaskBatch]] = WeakKeyDictionary()
