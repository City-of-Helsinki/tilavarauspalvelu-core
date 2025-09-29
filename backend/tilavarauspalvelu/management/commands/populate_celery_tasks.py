from __future__ import annotations

from typing import TYPE_CHECKING, Any

import celery
from django.core.management.base import BaseCommand
from django_celery_beat.models import CrontabSchedule, PeriodicTask

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import CeleryAutoCreateTaskSchedule


class Command(BaseCommand):
    help = "Populates the PeriodicTask model with registered Celery tasks."

    def handle(self, *args: Any, **options: Any) -> None:
        # Get all registered tasks
        tasks = celery.current_app.tasks

        existing_tasks = PeriodicTask.objects.values_list("task", flat=True)

        ignored_tasks = ("celery.", "health_check.")

        for task_name in tasks:
            # Skip built-in Celery tasks and tasks already in the database
            if task_name.startswith(ignored_tasks) or task_name in existing_tasks:
                continue

            tvp_auto_create_name: str = getattr(tasks[task_name], "tvp_auto_create_name", "")
            tvp_auto_create_description: str = getattr(tasks[task_name], "tvp_auto_create_description", "")
            tvp_auto_create_schedule: CeleryAutoCreateTaskSchedule | None = getattr(
                tasks[task_name], "tvp_auto_create_schedule", None
            )

            # Only create tasks that have a name and schedule defined, not all tasks should be PeriodicTasks
            if not tvp_auto_create_name or not tvp_auto_create_schedule:
                continue

            schedule_hour = tvp_auto_create_schedule.get("hour")
            schedule_minute = tvp_auto_create_schedule.get("minute")
            if not schedule_hour and not schedule_minute:
                continue

            # Don't use get_or_create, since it's possible to have duplicate schedules
            crontab_schedule = CrontabSchedule.objects.filter(hour=schedule_hour, minute=schedule_minute).first()
            if crontab_schedule is None:
                crontab_schedule = CrontabSchedule.objects.create(hour=schedule_hour, minute=schedule_minute)

            task = PeriodicTask.objects.filter(task=task_name).first()
            if task is None:
                PeriodicTask.objects.create(
                    task=task_name,
                    name=tvp_auto_create_name,
                    description=tvp_auto_create_description,
                    enabled=False,
                    crontab=crontab_schedule,
                )

        self.stdout.write(self.style.SUCCESS("Successfully populated Periodic Tasks."))
