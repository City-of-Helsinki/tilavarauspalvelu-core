from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import ReservationPurposeManager

if TYPE_CHECKING:
    from .actions import ReservationPurposeActions


__all__ = [
    "ReservationPurpose",
]


class ReservationPurpose(models.Model):
    name: str = models.CharField(max_length=200)

    # Translated field hints
    name_fi: str | None
    name_sv: str | None
    name_en: str | None

    objects = ReservationPurposeManager()

    class Meta:
        db_table = "reservation_purpose"
        base_manager_name = "objects"
        verbose_name = _("reservation purpose")
        verbose_name_plural = _("reservation purposes")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> ReservationPurposeActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationPurposeActions

        return ReservationPurposeActions(self)
