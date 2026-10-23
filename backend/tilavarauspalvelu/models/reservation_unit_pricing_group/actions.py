from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitPricingGroup


__all__ = [
    "ReservationUnitPricingGroupActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitPricingGroupActions:
    reservation_unit_pricing_group: ReservationUnitPricingGroup
