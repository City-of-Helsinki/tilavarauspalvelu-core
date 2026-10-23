from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitPricingGroup


__all__ = [
    "ReservationUnitPricingGroupValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitPricingGroupValidator:
    reservation_unit_pricing_group: ReservationUnitPricingGroup
