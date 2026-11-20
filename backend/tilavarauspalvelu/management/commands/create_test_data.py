from __future__ import annotations

import os
from typing import Any

from django.conf import settings
from django.core.management import BaseCommand, call_command

from .data_creation.main import create_test_data


class Command(BaseCommand):
    help = (
        "Creates test data for development purposes. "
        "In the dev environment, if the Verkkokauppa API is not mocked, then runs 'refresh_test_verkkokauppa_products'."
    )

    def handle(self, *args: Any, **options: Any) -> None:
        create_test_data()

        is_dev_environment = os.getenv("DJANGO_SETTINGS_ENVIRONMENT") == "Development"
        if is_dev_environment and not settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            call_command("refresh_test_verkkokauppa_products")
