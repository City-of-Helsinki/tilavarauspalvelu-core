from django.db import models

__all__ = [
    "ReservationDenyReason",
]


class ReservationDenyReason(models.Model):
    reason = models.CharField(max_length=255, null=False, blank=False)

    # Translated field hints
    reason_fi: str | None
    reason_sv: str | None
    reason_en: str | None

    class Meta:
        db_table = "reservation_deny_reason"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return self.reason
