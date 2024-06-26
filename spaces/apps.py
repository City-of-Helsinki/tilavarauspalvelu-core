from django.apps import AppConfig


class SpacesConfig(AppConfig):
    name = "spaces"

    def ready(self) -> None:
        # Register signals
        import spaces.signals  # noqa: F401
