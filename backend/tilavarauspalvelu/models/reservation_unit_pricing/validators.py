from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitPricing


__all__ = [
    "ReservationUnitPricingValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitPricingValidator:
    reservation_unit_payment_type: ReservationUnitPricing
