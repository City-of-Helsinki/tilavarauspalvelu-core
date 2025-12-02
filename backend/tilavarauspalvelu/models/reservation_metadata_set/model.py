from __future__ import annotations

from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.models._base import OneToManyRelatedManager
    from tilavarauspalvelu.models.reservation_unit.queryset import ReservationUnitQuerySet


__all__ = [
    "ReservationMetadataSet",
]


class ReservationMetadataSet(models.Model):
    name: str = models.CharField(max_length=100, unique=True)

    supported_fields = models.ManyToManyField(
        "tilavarauspalvelu.ReservationMetadataField",
        related_name="metadata_sets_supported",
    )

    required_fields = models.ManyToManyField(
        "tilavarauspalvelu.ReservationMetadataField",
        related_name="metadata_sets_required",
        blank=True,
    )

    reservation_units: OneToManyRelatedManager[ReservationUnit, ReservationUnitQuerySet]

    class Meta:
        db_table = "reservation_metadata_set"
        base_manager_name = "objects"
        verbose_name = _("reservation metadata set")
        verbose_name_plural = _("reservation metadata sets")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name
