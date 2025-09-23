from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitPricing


__all__ = [
    "ReservationUnitPricingValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitPricingValidator:
    reservation_unit_pricing: ReservationUnitPricing

    def validate_has_payment_type(self) -> None:
        payment_type = self.reservation_unit_pricing.payment_type
        if payment_type is None:
            msg = "Pricing has no payment type defined"
            raise ValidationError(msg, code=error_codes.RESERVATION_UNIT_PRICING_NO_PAYMENT_TYPE)
