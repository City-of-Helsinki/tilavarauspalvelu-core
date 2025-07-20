from __future__ import annotations

from typing import TYPE_CHECKING, ClassVar

from django.db import models
from django.utils.translation import gettext_lazy as _
from lazy_managers import LazyModelAttribute, LazyModelManager

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationMetadataSet
    from tilavarauspalvelu.models._base import ManyToManyRelatedManager
    from tilavarauspalvelu.models.reservation_metadata_set.queryset import ReservationMetadataSetQuerySet

    from .actions import ReservationMetadataFieldActions
    from .queryset import ReservationMetadataFieldManager
    from .validators import ReservationMetadataFieldValidator


__all__ = [
    "ReservationMetadataField",
]


class ReservationMetadataField(models.Model):
    field_name: str = models.CharField(max_length=100, unique=True)

    objects: ClassVar[ReservationMetadataFieldManager] = LazyModelManager.new()
    actions: ReservationMetadataFieldActions = LazyModelAttribute.new()
    validators: ReservationMetadataFieldValidator = LazyModelAttribute.new()

    metadata_sets_supported: ManyToManyRelatedManager[ReservationMetadataSet, ReservationMetadataSetQuerySet]
    metadata_sets_required: ManyToManyRelatedManager[ReservationMetadataSet, ReservationMetadataSetQuerySet]

    class Meta:
        db_table = "reservation_metadata_field"
        base_manager_name = "objects"
        verbose_name = _("reservation metadata field")
        verbose_name_plural = _("reservation metadata fields")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.field_name
