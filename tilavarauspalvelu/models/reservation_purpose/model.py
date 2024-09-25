from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import ReservationPurposeQuerySet

if TYPE_CHECKING:
    from .actions import ReservationPurposeActions


class ReservationPurpose(models.Model):
    name = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = ReservationPurposeQuerySet.as_manager()

    class Meta:
        db_table = "reservation_purpose"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> ReservationPurposeActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationPurposeActions

        return ReservationPurposeActions(self)
