from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from django.db.models.functions import RowNumber

from tilavarauspalvelu.models import ReservationUnitPricing
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_date

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import TaxPercentage

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
        today = local_date()
        if from_date is None:
            from_date = today

        return self.filter(
            models.Q(begins__lte=today)  # Is active regardless of `is_activated_on_begins` value
            | models.Q(begins__lte=from_date, is_activated_on_begins=False)
        ).order_by("-begins")

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

    def latest_pricings_for_tax_update(self, change_date: datetime.date, ignored_company_codes: list[str]) -> Self:
        """Get last pricing for each reservation unit before the change date"""
        return (
            self
            .filter(
                models.Q(begins__lte=change_date, highest_price=0)  # Ignore FREE pricings after the change date
                | models.Q(highest_price__gt=0)
            )
            .exclude(reservation_unit__payment_accounting__company_code__in=ignored_company_codes)
            .exclude(
                # Use Unit's Payment Accounting, only if Reservation Unit's Payment Accounting is not set
                reservation_unit__unit__payment_accounting__company_code__in=ignored_company_codes,
                reservation_unit__payment_accounting__isnull=True,
            )
            .order_by("reservation_unit_id", "-begins")
            .distinct("reservation_unit_id")
        )

    def pricings_with_tax_percentage(self, after_date: datetime.date, tax_percentage: TaxPercentage) -> Self:
        """Get pricings for the given tax percentage from the given date."""
        return self.filter(
            begins__gte=after_date,
            tax_percentage=tax_percentage,
            highest_price__gt=0,
        )


class ReservationUnitPricingManager(ModelManager[ReservationUnitPricing, ReservationUnitPricingQuerySet]): ...
