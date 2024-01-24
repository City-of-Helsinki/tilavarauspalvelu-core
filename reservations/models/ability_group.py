from django.db import models

__all__ = [
    "AbilityGroup",
]


class AbilityGroup(models.Model):
    name = models.fields.TextField(null=False, blank=False, unique=True)

    class Meta:
        db_table = "ability_group"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.name
