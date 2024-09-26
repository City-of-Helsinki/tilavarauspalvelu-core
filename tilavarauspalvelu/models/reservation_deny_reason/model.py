from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import ReservationDenyReasonManager

if TYPE_CHECKING:
    from .actions import ReservationDenyReasonActions


__all__ = [
    "ReservationDenyReason",
]


class ReservationDenyReason(models.Model):
    rank: int = models.PositiveIntegerField(default=0, db_index=True)  # Used for ordering

    reason: str = models.CharField(max_length=255)

    # Translated field hints
    reason_fi: str | None
    reason_sv: str | None
    reason_en: str | None

    objects = ReservationDenyReasonManager()

    class Meta:
        db_table = "reservation_deny_reason"
        base_manager_name = "objects"
        verbose_name = _("reservation deny reason")
        verbose_name_plural = _("reservation deny reasons")
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.reason

    @cached_property
    def actions(self) -> ReservationDenyReasonActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationDenyReasonActions

        return ReservationDenyReasonActions(self)
