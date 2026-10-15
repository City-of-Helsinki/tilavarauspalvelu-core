from __future__ import annotations

import io

import pytest
from django.core.management import call_command
from django_celery_beat.models import CrontabSchedule, PeriodicTask

pytestmark = [
    pytest.mark.django_db,
]


def test_populate_celery_tasks__creates_disabled_periodic_task_for_scheduled_task():
    output = io.StringIO()

    call_command("populate_celery_tasks", stdout=output)

    task = PeriodicTask.objects.get(task="rebuild_space_tree_hierarchy")
    assert task.name == "Päivitä tilojen puuhierarkia"
    assert task.enabled is False
    assert task.crontab.hour == "3"
    assert task.crontab.minute == "30"

    assert output.getvalue() == "Successfully populated Periodic Tasks.\n"


def test_populate_celery_tasks__skips_tasks_without_schedule():
    call_command("populate_celery_tasks", stdout=io.StringIO())

    assert PeriodicTask.objects.filter(task="save_personal_info_view_log").exists() is False
    assert PeriodicTask.objects.filter(task__startswith="celery.").exists() is False


def test_populate_celery_tasks__keeps_existing_periodic_task():
    crontab = CrontabSchedule.objects.create(hour="5", minute="0")
    PeriodicTask.objects.create(
        task="rebuild_space_tree_hierarchy",
        name="Custom name",
        enabled=True,
        crontab=crontab,
    )

    call_command("populate_celery_tasks", stdout=io.StringIO())

    tasks = list(PeriodicTask.objects.filter(task="rebuild_space_tree_hierarchy"))
    assert len(tasks) == 1
    assert tasks[0].name == "Custom name"
    assert tasks[0].enabled is True
    assert tasks[0].crontab == crontab


def test_populate_celery_tasks__reuses_existing_crontab_schedule():
    crontab = CrontabSchedule.objects.create(hour="3", minute="30")

    call_command("populate_celery_tasks", stdout=io.StringIO())

    task = PeriodicTask.objects.get(task="rebuild_space_tree_hierarchy")
    assert task.crontab == crontab
    assert CrontabSchedule.objects.filter(hour="3", minute="30").count() == 1


def test_populate_celery_tasks__running_twice_creates_no_duplicates():
    call_command("populate_celery_tasks", stdout=io.StringIO())
    task_count = PeriodicTask.objects.count()
    crontab_count = CrontabSchedule.objects.count()

    call_command("populate_celery_tasks", stdout=io.StringIO())

    assert task_count > 0
    assert PeriodicTask.objects.count() == task_count
    assert CrontabSchedule.objects.count() == crontab_count
