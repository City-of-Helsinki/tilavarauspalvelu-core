from django.apps import AppConfig


class ReservationsConfig(AppConfig):
    name = "reservations"

    def ready(self) -> None:
        import reservations.signals  # noqa: F401
