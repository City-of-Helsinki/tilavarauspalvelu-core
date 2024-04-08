from django.db import models

__all__ = [
    "ReservationPurpose",
]


class ReservationPurpose(models.Model):
    name = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "reservation_purpose"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return self.name
