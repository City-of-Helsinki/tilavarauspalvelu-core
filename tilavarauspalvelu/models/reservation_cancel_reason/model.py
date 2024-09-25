from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import ReservationCancelReasonQuerySet

if TYPE_CHECKING:
    from .actions import ReservationCancelReasonActions

__all__ = [
    "ReservationCancelReason",
]


class ReservationCancelReason(models.Model):
    reason = models.CharField(max_length=255, null=False, blank=False)

    # Translated field hints
    reason_fi: str | None
    reason_en: str | None
    reason_sv: str | None

    objects = ReservationCancelReasonQuerySet.as_manager()

    class Meta:
        db_table = "reservation_cancel_reason"
        base_manager_name = "objects"
        ordering = [
            "pk",
        ]

    def __str__(self) -> str:
        return self.reason

    @cached_property
    def actions(self) -> ReservationCancelReasonActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationCancelReasonActions

        return ReservationCancelReasonActions(self)
