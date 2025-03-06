from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationStatisticsReservationUnit


__all__ = [
    "ReservationStatisticsReservationUnitValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationStatisticsReservationUnitValidator:
    reservation_statistics_reservation_unit: ReservationStatisticsReservationUnit
