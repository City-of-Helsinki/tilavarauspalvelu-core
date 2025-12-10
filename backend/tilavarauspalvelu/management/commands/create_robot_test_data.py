from __future__ import annotations

from typing import Any

from django.core.management import BaseCommand

from tilavarauspalvelu.tasks import create_robot_test_data_task


class Command(BaseCommand):
    help = "Creates test data for robotframework tests."

    def handle(self, *args: Any, **options: Any) -> None:
        create_robot_test_data_task.delay()
