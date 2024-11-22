import datetime
import math
from decimal import Decimal
from typing import TYPE_CHECKING

from tilavarauspalvelu.enums import PriceUnit

if TYPE_CHECKING:
    from .model import ReservationUnitPricing


class ReservationUnitPricingActions:
    def __init__(self, pricing: "ReservationUnitPricing") -> None:
        self.pricing = pricing

    def calculate_reservation_price(self, duration: datetime.timedelta, *, subsidised: bool = False) -> Decimal:
        if self.pricing.highest_price == 0:
            return Decimal(0)

        price_unit = PriceUnit(self.pricing.price_unit)
        price = self.pricing.lowest_price if subsidised else self.pricing.highest_price

        # Time-based calculation is needed only if price unit is not fixed.
        # Otherwise, we can just use the price defined in the reservation unit
        if price_unit in PriceUnit.fixed_price_units:
            return price

        # Price calculations use duration rounded to the next 15 minutes
        duration_seconds = int(duration.total_seconds())
        duration_minutes = int(math.ceil(duration_seconds / 60 / 15) * 15)

        return (price / price_unit.in_minutes) * duration_minutes
