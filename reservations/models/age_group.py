from django.db import models

__all__ = [
    "AgeGroup",
]


class AgeGroup(models.Model):
    minimum: str = models.fields.PositiveIntegerField()
    maximum: str | None = models.fields.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "age_group"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return f"{self.minimum} - {self.maximum or ''}"
