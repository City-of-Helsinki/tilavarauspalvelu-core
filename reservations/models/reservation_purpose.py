from django.db import models

__all__ = [
    "ReservationPurpose",
]


class ReservationPurpose(models.Model):
    name = models.CharField(max_length=200)

    class Meta:
        db_table = "reservation_purpose"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.name
