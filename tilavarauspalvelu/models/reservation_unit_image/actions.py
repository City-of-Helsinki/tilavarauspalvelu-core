from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitImage


class ReservationUnitImageActions:
    def __init__(self, reservation_unit_image: ReservationUnitImage) -> None:
        self.reservation_unit_image = reservation_unit_image
