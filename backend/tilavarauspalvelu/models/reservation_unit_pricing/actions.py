from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitPricing


__all__ = [
    "ReservationUnitPricingActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitPricingActions:
    pricing: ReservationUnitPricing
