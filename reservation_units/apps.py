from django.apps import AppConfig


class ReservationUnitsConfig(AppConfig):
    name = "reservation_units"

    def ready(self) -> None:
        # Register signals
        import reservation_units.signals  # noqa: F401
