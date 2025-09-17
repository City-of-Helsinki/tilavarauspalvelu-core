from __future__ import annotations

from typing import Any

from django.apps import AppConfig
from django.conf import settings
from django.core.management import call_command
from django.db.models.signals import post_migrate


class TilavarauspalveluConfig(AppConfig):
    name = "tilavarauspalvelu"

    def ready(self) -> None:
        self.register_signals()
        self.register_converters()

        if settings.AUTO_CREATE_CELERY_TASKS:
            # Run after migration command is run, even if no migrations are applied
            # Essentially this is run every time a new version is deployed to a server
            post_migrate.connect(self.run_populate_celery_tasks, sender=self)

    def register_signals(self) -> None:
        import tilavarauspalvelu.signals  # noqa: F401

    def register_converters(self) -> None:
        import tilavarauspalvelu.api.graphql.extensions.converters  # noqa: F401

    def run_populate_celery_tasks(self, **kwargs: Any) -> None:
        call_command("populate_celery_tasks")
