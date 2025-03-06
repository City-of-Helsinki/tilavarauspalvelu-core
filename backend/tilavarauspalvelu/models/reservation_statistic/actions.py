from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationStatistic


__all__ = [
    "ReservationStatisticActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationStatisticActions:
    reservation_statistic: ReservationStatistic
