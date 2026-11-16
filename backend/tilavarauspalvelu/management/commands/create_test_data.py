from typing import Any

from django.core.management import BaseCommand

from .data_creation.main import create_test_data


class Command(BaseCommand):
    help = "Creates test data for development purposes."

    def handle(self, *args: Any, **options: Any) -> str | None:
        return create_test_data()
