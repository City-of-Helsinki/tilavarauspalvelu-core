from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _

from utils.lazy import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from .actions import ReservationPurposeActions
    from .queryset import ReservationPurposeManager
    from .validators import ReservationPurposeValidator


__all__ = [
    "ReservationPurpose",
]


class ReservationPurpose(models.Model):
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    name: str = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[ReservationPurposeManager] = LazyModelManager.new()
    actions: ReservationPurposeActions = LazyModelAttribute.new()
    validators: ReservationPurposeValidator = LazyModelAttribute.new()

    class Meta:
        db_table = "reservation_purpose"
        base_manager_name = "objects"
        verbose_name = _("reservation purpose")
        verbose_name_plural = _("reservation purposes")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name
