from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.utils import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import CityActions
    from .queryset import CityManager
    from .validators import CityValidator

__all__ = [
    "City",
]


class City(models.Model):
    name: str = models.CharField(max_length=100)
    municipality_code: str = models.CharField(max_length=30, default="")

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects: ClassVar[CityManager] = LazyModelManager.new()
    actions: CityActions = LazyModelAttribute.new()
    validators: CityValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "city"
        base_manager_name = "objects"
        verbose_name = _("city")
        verbose_name_plural = _("cities")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name
