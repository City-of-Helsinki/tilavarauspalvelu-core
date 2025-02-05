from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import ReservationMetadataSetManager

if TYPE_CHECKING:
    from .actions import ReservationMetadataSetActions


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

    objects = ReservationMetadataSetManager()

    class Meta:
        db_table = "reservation_metadata_set"
        base_manager_name = "objects"
        verbose_name = _("reservation metadata set")
        verbose_name_plural = _("reservation metadata sets")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> ReservationMetadataSetActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationMetadataSetActions

        return ReservationMetadataSetActions(self)
