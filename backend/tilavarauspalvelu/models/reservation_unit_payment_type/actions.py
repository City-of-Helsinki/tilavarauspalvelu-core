from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitPaymentType


__all__ = [
    "ReservationUnitPaymentTypeActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitPaymentTypeActions:
    reservation_unit_payment_type: ReservationUnitPaymentType
