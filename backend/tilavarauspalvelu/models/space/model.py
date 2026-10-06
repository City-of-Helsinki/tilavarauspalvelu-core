from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager
from mptt.fields import TreeForeignKey
from mptt.models import MPTTModel

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit, Resource, Unit
    from tilavarauspalvelu.models._base import ManyToManyRelatedManager, OneToManyRelatedManager
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet
    from tilavarauspalvelu.models.resource.queryset import ResourceQuerySet

    from .actions import SpaceActions
    from .queryset import SpaceManager
    from .validators import SpaceValidator


__all__ = [
    "Space",
]


class Space(MPTTModel):
    name: str = models.CharField(max_length=255)
    surface_area: int | None = models.IntegerField(blank=True, null=True)
    max_persons: int | None = models.PositiveIntegerField(null=True, blank=True)
    code: str = models.CharField(max_length=255, db_index=True, blank=True, default="")

    parent: Space | None = TreeForeignKey(
        "self",
        related_name="children",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    unit: Unit = models.ForeignKey(
        "tilavarauspalvelu.Unit",
        related_name="spaces",
        on_delete=models.PROTECT,
    )

    # MPTT field hints
    tree_id: int
    level: int
    lft: int
    rght: int

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[SpaceManager] = LazyModelManager.new()
    actions: SpaceActions = LazyModelAttribute.new()
    validators: SpaceValidator = LazyModelAttribute.new()

    resources: OneToManyRelatedManager[Resource, ResourceQuerySet]
    reservation_units: ManyToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]

    class Meta:
        db_table = "space"
        base_manager_name = "objects"
        verbose_name = _("space")
        verbose_name_plural = _("spaces")
        ordering = ["pk"]

    def __str__(self) -> str:
        value = self.name
        if self.unit is not None:
            value += f", {self.unit!s}"
        return value
