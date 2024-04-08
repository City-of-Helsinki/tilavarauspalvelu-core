from django.db import models
from django.db.models import Deferrable

__all__ = [
    "EventReservationUnit",
]


# DEPRECATED: Use ReservationUnitOption model instead
class EventReservationUnit(models.Model):
    preferred_order = models.PositiveIntegerField()

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

    class Meta:
        db_table = "event_reservation_unit"
        base_manager_name = "objects"
        ordering = [
            "preferred_order",
        ]
        constraints = [
            models.UniqueConstraint(
                name="unique_application_event_preferred_order",
                fields=["application_event", "preferred_order"],
                # Allows swapping `preferred_order` of two event reservation units
                # for the same application event in a transaction
                deferrable=Deferrable.DEFERRED,
            ),
        ]

    def __str__(self) -> str:
        return (
            f"{self.preferred_order}) application event '{self.application_event.name}' "
            f"reservation unit '{self.reservation_unit.name}'"
        )
