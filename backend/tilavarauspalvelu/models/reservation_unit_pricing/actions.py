from __future__ import annotations

import dataclasses
import math
from decimal import Decimal
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import PriceUnit

if TYPE_CHECKING:
    import datetime

    from .model import ReservationUnitPricing

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
