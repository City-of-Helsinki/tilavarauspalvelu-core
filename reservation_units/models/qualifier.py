from django.db import models

__all__ = [
    "Qualifier",
]


class Qualifier(models.Model):
    name = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    class Meta:
        db_table = "qualifier"
        base_manager_name = "objects"

    def __str__(self) -> str:
        return self.name
