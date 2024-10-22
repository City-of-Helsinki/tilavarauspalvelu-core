from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import ReservationCancelReasonManager

if TYPE_CHECKING:
    from .actions import ReservationCancelReasonActions

__all__ = [
    "ReservationCancelReason",
]


class ReservationCancelReason(models.Model):
    reason: str = models.CharField(max_length=255)

    # Translated field hints
    reason_fi: str | None
    reason_en: str | None
    reason_sv: str | None

    objects = ReservationCancelReasonManager()

    class Meta:
        db_table = "reservation_cancel_reason"
        base_manager_name = "objects"
        verbose_name = _("reservation cancel reason")
        verbose_name_plural = _("reservation cancel reasons")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.reason

    @cached_property
    def actions(self) -> ReservationCancelReasonActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationCancelReasonActions

        return ReservationCancelReasonActions(self)
