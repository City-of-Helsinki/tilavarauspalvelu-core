from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationStatistic


__all__ = [
    "ReservationStatisticValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationStatisticValidator:
    reservation_statistic: ReservationStatistic
