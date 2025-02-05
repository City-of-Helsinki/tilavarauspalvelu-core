from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitPaymentType


class ReservationUnitPaymentTypeActions:
    def __init__(self, reservation_unit_payment_type: ReservationUnitPaymentType) -> None:
        self.reservation_unit_payment_type = reservation_unit_payment_type
