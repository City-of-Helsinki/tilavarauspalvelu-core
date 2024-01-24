from django.db import models

__all__ = [
    "ReservationCancelReason",
]


class ReservationCancelReason(models.Model):
    reason = models.CharField(max_length=255, null=False, blank=False)

    class Meta:
        db_table = "reservation_cancel_reason"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.reason
