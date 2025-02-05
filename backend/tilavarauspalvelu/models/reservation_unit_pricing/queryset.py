from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from django.db.models.functions import RowNumber

from utils.date_utils import local_date

if TYPE_CHECKING:
    import datetime

__all__ = [
    "ReservationUnitPricingManager",
    "ReservationUnitPricingQuerySet",
]


class ReservationUnitPricingQuerySet(models.QuerySet):
    def exclude_past(self) -> models.QuerySet:
        """Return all currently active and future pricings."""
        today = local_date()

        return self.alias(
            reservation_unit_active_pricing_begins_date=models.Subquery(
                self.model.objects.filter(
                    reservation_unit=models.OuterRef("reservation_unit"),
                    begins__lte=today,
                )
                .values("begins")
                .order_by("-begins")[:1]
            )
        ).filter(begins__gte=models.F("reservation_unit_active_pricing_begins_date"))

    def past_or_active(self, from_date: datetime.date | None = None) -> Self:
        """Get only past or active pricings, ordered from most recent to oldest."""
        today = local_date()
        if from_date is None:
            from_date = today

        return self.filter(
            models.Q(begins__lte=today)  # Is active regardless of `is_activated_on_begins` value
            | models.Q(begins__lte=from_date, is_activated_on_begins=False)
        ).order_by("-begins")

    def active(self, from_date: datetime.date | None = None) -> Self:
        """Get only active pricings for each reservation unit."""
        return (
            self.past_or_active(from_date=from_date)
            .alias(
                row_number=models.Window(
                    expression=RowNumber(),
                    partition_by=[models.F("reservation_unit_id")],
                    order_by="-begins",
                ),
            )
            .filter(row_number=1)
        )


class ReservationUnitPricingManager(models.Manager.from_queryset(ReservationUnitPricingQuerySet)): ...
