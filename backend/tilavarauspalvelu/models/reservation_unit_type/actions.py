from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitType


__all__ = [
    "ReservationUnitTypeActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitTypeActions:
    reservation_unit_type: ReservationUnitType
