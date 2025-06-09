from __future__ import annotations

import inspect
from typing import Any

from celery.contrib.django.task import Task

from tilavarauspalvelu import tasks


def get_tasks() -> list[tuple[str, Task]]:
    def predicate(value: Any) -> bool:
        return isinstance(value, Task)

    return inspect.getmembers(tasks, predicate)


def test_that_there_are_no_duplicate_tasks():
    known_tasks: set[str] = set()

    for func_name, _task_func in get_tasks():
        assert func_name not in known_tasks, f"Duplicate task found: {func_name!r}"

        known_tasks.add(func_name)


def test_that_task_name_matches_its_function_name():
    for task_func_name, task_func in get_tasks():
        assert task_func_name.endswith("_task"), f"Task {task_func_name!r} should end with '_task'"

        func_name = task_func_name.removesuffix("_task")

        assert func_name == task_func.name, f"Task function {func_name!r} should match task name {task_func.name!r}"
