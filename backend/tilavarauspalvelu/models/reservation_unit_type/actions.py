from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitType


class ReservationUnitTypeActions:
    def __init__(self, reservation_unit_type: ReservationUnitType) -> None:
        self.reservation_unit_type = reservation_unit_type
