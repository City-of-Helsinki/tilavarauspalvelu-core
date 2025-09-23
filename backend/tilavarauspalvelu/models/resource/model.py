from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

from tilavarauspalvelu.enums import ResourceLocationType
from utils.fields.model import TextChoicesField

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit, Space
    from tilavarauspalvelu.models._base import ManyToManyRelatedManager
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet

    from .actions import ResourceActions
    from .queryset import ResourceManager
    from .validators import ResourceValidator


__all__ = [
    "Resource",
]


class Resource(models.Model):
    name: str = models.CharField(max_length=255)

    location_type: ResourceLocationType = TextChoicesField(
        enum=ResourceLocationType,
        default=ResourceLocationType.FIXED,
    )

    space: Space | None = models.ForeignKey(
        "tilavarauspalvelu.Space",
        related_name="resources",
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
    )

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects: ClassVar[ResourceManager] = LazyModelManager.new()
    actions: ResourceActions = LazyModelAttribute.new()
    validators: ResourceValidator = LazyModelAttribute.new()

    reservation_units: ManyToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]

    class Meta:
        db_table = "resource"
        base_manager_name = "objects"
        verbose_name = _("resource")
        verbose_name_plural = _("resources")
        ordering = ["pk"]

    def __str__(self) -> str:
        value = self.name
        if self.space is not None:
            value += f" ({self.space!s})"
        return value
