from django.db import models

__all__ = [
    "AgeGroup",
]


class AgeGroup(models.Model):
    minimum = models.fields.PositiveIntegerField(null=False, blank=False)
    maximum = models.fields.PositiveIntegerField(null=True, blank=True)

    class Meta:
        db_table = "age_group"
        base_manager_name = "objects"

    def __str__(self) -> str:
        if self.maximum is None:
            return f"{self.minimum}+"
        return f"{self.minimum} - {self.maximum}"
