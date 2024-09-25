from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitPricing


class ReservationUnitPricingActions:
    def __init__(self, reservation_unit_pricing: "ReservationUnitPricing") -> None:
        self.reservation_unit_pricing = reservation_unit_pricing
