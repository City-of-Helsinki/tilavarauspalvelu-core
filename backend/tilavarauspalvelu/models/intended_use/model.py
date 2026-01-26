from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from easy_thumbnails.files import ThumbnailerImageFieldFile

    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.models._base import ManyToManyRelatedManager
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet

    from .actions import IntendedUseActions
    from .queryset import IntendedUseManager
    from .validators import IntendedUseValidator


__all__ = [
    "IntendedUse",
]


class IntendedUse(models.Model):
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    name: str = models.CharField(max_length=200)

    image: ThumbnailerImageFieldFile | None

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects: ClassVar[IntendedUseManager] = LazyModelManager.new()
    actions: IntendedUseActions = LazyModelAttribute.new()
    validators: IntendedUseValidator = LazyModelAttribute.new()

    reservation_units: ManyToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]

    class Meta:
        db_table = "intended_use"
        base_manager_name = "objects"
        verbose_name = _("intended use")
        verbose_name_plural = _("intended uses")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.name
