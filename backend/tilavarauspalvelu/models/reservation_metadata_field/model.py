from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import ReservationMetadataFieldManager

if TYPE_CHECKING:
    from .actions import ReservationMetadataFieldActions


__all__ = [
    "ReservationMetadataField",
]


class ReservationMetadataField(models.Model):
    field_name: str = models.CharField(max_length=100, unique=True)

    objects = ReservationMetadataFieldManager()

    class Meta:
        db_table = "reservation_metadata_field"
        base_manager_name = "objects"
        verbose_name = _("reservation metadata field")
        verbose_name_plural = _("reservation metadata fields")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.field_name

    @cached_property
    def actions(self) -> ReservationMetadataFieldActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationMetadataFieldActions

        return ReservationMetadataFieldActions(self)
