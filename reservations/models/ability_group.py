from django.db import models

__all__ = [
    "AbilityGroup",
]


class AbilityGroup(models.Model):
    name: str = models.fields.TextField(unique=True)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "ability_group"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.name
