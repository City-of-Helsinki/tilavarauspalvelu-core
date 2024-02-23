from django.db import models
from django.utils.translation import gettext_lazy as _

__all__ = [
    "City",
]


class City(models.Model):
    name = models.CharField(max_length=100)
    municipality_code = models.CharField(default="", max_length=30)

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    class Meta:
        db_table = "city"
        base_manager_name = "objects"
        verbose_name = _("City")
        verbose_name_plural = _("Cities")

    def __str__(self) -> str:
        return self.name
