from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import ReservationUnitTypeActions
    from .queryset import ReservationUnitTypeManager
    from .validators import ReservationUnitTypeValidator


__all__ = [
    "ReservationUnitType",
]


class ReservationUnitType(models.Model):
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    name: str = models.CharField(max_length=255)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[ReservationUnitTypeManager] = LazyModelManager.new()
    actions: ReservationUnitTypeActions = LazyModelAttribute.new()
    validators: ReservationUnitTypeValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_unit_type"
        base_manager_name = "objects"
        verbose_name = _("reservation unit type")
        verbose_name_plural = _("reservation unit types")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name
