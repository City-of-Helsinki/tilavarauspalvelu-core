from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitPaymentType


__all__ = [
    "ReservationUnitPaymentTypeValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitPaymentTypeValidator:
    reservation_unit_payment_type: ReservationUnitPaymentType
