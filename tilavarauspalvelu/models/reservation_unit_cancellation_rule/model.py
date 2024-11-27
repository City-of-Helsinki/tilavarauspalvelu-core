from __future__ import annotations

import datetime
from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models
from django.utils.translation import gettext_lazy as _

from .queryset import ReservationUnitCancellationRuleManager

if TYPE_CHECKING:
    from .actions import ReservationUnitCancellationRuleActions

__all__ = [
    "ReservationUnitCancellationRule",
]


class ReservationUnitCancellationRule(models.Model):
    name: str = models.CharField(max_length=255)
    can_be_cancelled_time_before: datetime.timedelta | None = models.DurationField(
        default=datetime.timedelta(hours=24),
        blank=True,
        null=True,
    )

    # Translated field hints
    name_fi: str | None
    name_en: str | None
    name_sv: str | None

    objects = ReservationUnitCancellationRuleManager()

    class Meta:
        db_table = "reservation_unit_cancellation_rule"
        base_manager_name = "objects"
        verbose_name = _("reservation unit cancellation rule")
        verbose_name_plural = _("reservation unit cancellation rules")
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.name

    @cached_property
    def actions(self) -> ReservationUnitCancellationRuleActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitCancellationRuleActions

        return ReservationUnitCancellationRuleActions(self)
