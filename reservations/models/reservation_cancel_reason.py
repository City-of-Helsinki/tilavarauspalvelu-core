from django.db import models

__all__ = [
    "ReservationCancelReason",
]


class ReservationCancelReason(models.Model):
    reason: str = models.CharField(max_length=255)

    # Translated field hints
    reason_fi: str | None
    reason_sv: str | None
    reason_en: str | None

    class Meta:
        db_table = "reservation_cancel_reason"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.reason
