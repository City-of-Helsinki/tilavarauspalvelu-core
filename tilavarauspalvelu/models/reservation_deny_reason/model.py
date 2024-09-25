from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import ReservationDenyReasonQuerySet

if TYPE_CHECKING:
    from .actions import ReservationDenyReasonActions


class ReservationDenyReason(models.Model):
    rank: int | None = models.PositiveBigIntegerField(null=True, blank=True, db_index=True)
    reason: str = models.CharField(max_length=255)

    # Translated field hints
    reason_fi: str | None
    reason_sv: str | None
    reason_en: str | None

    objects = ReservationDenyReasonQuerySet.as_manager()

    class Meta:
        db_table = "reservation_deny_reason"
        base_manager_name = "objects"
        ordering = ["rank"]

    def __str__(self) -> str:
        return self.reason

    @cached_property
    def actions(self) -> ReservationDenyReasonActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationDenyReasonActions

        return ReservationDenyReasonActions(self)
