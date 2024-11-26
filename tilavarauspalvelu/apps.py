from __future__ import annotations

from django.apps import AppConfig


class TilavarauspalveluConfig(AppConfig):
    name = "tilavarauspalvelu"

    def ready(self) -> None:
        # Register signals
        import tilavarauspalvelu.signals  # noqa: F401
