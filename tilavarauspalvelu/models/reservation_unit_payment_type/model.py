from __future__ import annotations

from functools import cached_property
from typing import TYPE_CHECKING

from django.db import models

from .queryset import ReservationUnitPaymentTypeQuerySet

if TYPE_CHECKING:
    from .actions import ReservationUnitPaymentTypeActions

__all__ = [
    "ReservationUnitPaymentType",
]


class ReservationUnitPaymentType(models.Model):
    code = models.CharField(max_length=32, primary_key=True)

    objects = ReservationUnitPaymentTypeQuerySet.as_manager()

    class Meta:
        db_table = "reservation_unit_payment_type"
        base_manager_name = "objects"
        ordering = ["pk"]

    def __str__(self) -> str:
        return self.code

    @cached_property
    def actions(self) -> ReservationUnitPaymentTypeActions:
        # Import actions inline to defer loading them.
        # This allows us to avoid circular imports.
        from .actions import ReservationUnitPaymentTypeActions

        return ReservationUnitPaymentTypeActions(self)
