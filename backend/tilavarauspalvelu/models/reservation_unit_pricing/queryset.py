from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from django.db.models.functions import RowNumber

from tilavarauspalvelu.models import ReservationUnitPricing
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_date

if TYPE_CHECKING:
    import datetime

__all__ = [
    "ReservationUnitPricingManager",
    "ReservationUnitPricingQuerySet",
]


class ReservationUnitPricingQuerySet(ModelQuerySet[ReservationUnitPricing]):
    def exclude_past(self) -> Self:
        """Return all currently active and future pricings."""
        today = local_date()

        return self.alias(
            reservation_unit_active_pricing_begins_date=models.Subquery(
                self.model.objects
                .filter(
                    reservation_unit=models.OuterRef("reservation_unit"),
                    begins__lte=today,
                )
                .values("begins")
                .order_by("-begins")[:1]
            )
        ).filter(begins__gte=models.F("reservation_unit_active_pricing_begins_date"))

    def past_or_active(self, from_date: datetime.date | models.F | None = None) -> Self:
        """Get only past or active pricings, ordered from most recent to oldest."""
        if from_date is None:
            from_date = local_date()

        return self.filter(begins__lte=from_date).order_by("-begins")

    def active(self, from_date: datetime.date | models.F | None = None) -> Self:
        """Get only active pricings for each reservation unit."""
        return (
            self
            .past_or_active(from_date=from_date)
            .alias(
                row_number=models.Window(
                    expression=RowNumber(),
                    partition_by=[models.F("reservation_unit_id")],
                    order_by="-begins",
                ),
            )
            .filter(row_number=1)
        )


class ReservationUnitPricingManager(ModelManager[ReservationUnitPricing, ReservationUnitPricingQuerySet]): ...
