from __future__ import annotations

from django.apps import AppConfig


class TilavarauspalveluConfig(AppConfig):
    name = "tilavarauspalvelu"

    def ready(self) -> None:
        self.register_signals()
        self.register_converters()

    def register_signals(self) -> None:
        import tilavarauspalvelu.signals  # noqa: F401

    def register_converters(self) -> None:
        import tilavarauspalvelu.api.graphql.extensions.converters  # noqa: F401
