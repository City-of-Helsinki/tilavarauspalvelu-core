from __future__ import annotations

import dataclasses
import math
from decimal import Decimal
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import PriceUnit

from .model import ReservationUnitPricing

if TYPE_CHECKING:
    import datetime
    from collections.abc import Collection

    from tilavarauspalvelu.models import TaxPercentage


__all__ = [
    "ReservationUnitPricingActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitPricingActions:
    pricing: ReservationUnitPricing

    def calculate_reservation_price(self, duration: datetime.timedelta, *, subsidised: bool = False) -> Decimal:
        if self.pricing.highest_price == 0:
            return Decimal(0)

        price_unit = PriceUnit(self.pricing.price_unit)
        price = self.pricing.lowest_price if subsidised else self.pricing.highest_price

        # Time-based calculation is needed only if price unit is not fixed.
        # Otherwise, we can just use the price defined in the reservation unit
        if price_unit.is_fixed:
            return price

        # Price calculations use duration rounded to the next 15 minutes
        duration_seconds = int(duration.total_seconds())
        duration_minutes = int(math.ceil(duration_seconds / 60 / 15) * 15)

        price_per_minute = price / price_unit.in_minutes
        return price_per_minute * duration_minutes

    @classmethod
    def add_new_pricings_for_tax_percentage(
        cls,
        current_tax_percentage: TaxPercentage,
        future_tax_percentage: TaxPercentage,
        change_date: datetime.date,
        ignored_company_codes: Collection[str],
    ) -> list[ReservationUnitPricing]:
        """Create new pricings for the current tax percentage with the future tax percentage from the given date."""
        latest_pricings = ReservationUnitPricing.objects.latest_pricings_for_tax_update(
            change_date=change_date,
            ignored_company_codes=ignored_company_codes,
        )

        new_pricings: list[ReservationUnitPricing] = [
            ReservationUnitPricing(
                begins=change_date,
                tax_percentage=future_tax_percentage,
                price_unit=pricing.price_unit,
                lowest_price=pricing.lowest_price,
                highest_price=pricing.highest_price,
                reservation_unit=pricing.reservation_unit,
                is_activated_on_begins=True,
            )
            for pricing in latest_pricings
            # Skip pricings that are FREE or have a different tax percentage.
            # We don't want to filter these away in the queryset, as that might cause us to incorrectly create
            # new pricings in some cases. e.g. Current pricing is PAID, but the future pricing is FREE or has
            # a different tax percentage.
            if (
                pricing.highest_price > 0
                and pricing.tax_percentage == current_tax_percentage
                # Don't create a new pricing if the reservation unit has a future pricing after the change date
                and pricing.begins < change_date
            )
        ]

        return ReservationUnitPricing.objects.bulk_create(new_pricings)
