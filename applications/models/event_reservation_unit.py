from django.db import models

__all__ = [
    "EventReservationUnit",
]


class EventReservationUnit(models.Model):
    priority = models.IntegerField(null=True, blank=True)

    application_event = models.ForeignKey(
        "applications.ApplicationEvent",
        on_delete=models.CASCADE,
        related_name="event_reservation_units",
    )
    reservation_unit = models.ForeignKey(
        "reservation_units.ReservationUnit",
        on_delete=models.PROTECT,
        related_name="event_reservation_units",
    )

    def __str__(self) -> str:
        return f"EventReservationUnit {self.priority} {self.id}"
