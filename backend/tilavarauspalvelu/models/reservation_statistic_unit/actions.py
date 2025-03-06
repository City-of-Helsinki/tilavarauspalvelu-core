from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationStatisticsReservationUnit


__all__ = [
    "ReservationStatisticsReservationUnitActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationStatisticsReservationUnitActions:
    reservation_statistics_reservation_unit: ReservationStatisticsReservationUnit
