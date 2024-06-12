from django.db import models

__all__ = [
    "ReservationDenyReason",
]


class ReservationDenyReason(models.Model):
    rank: int | None = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    reason: str = models.CharField(max_length=255)

    # Translated field hints
    reason_fi: str | None
    reason_sv: str | None
    reason_en: str | None

    class Meta:
        db_table = "reservation_deny_reason"
        base_manager_name = "objects"
        ordering = [
            "rank",
        ]

    def __str__(self) -> str:
        return self.reason
