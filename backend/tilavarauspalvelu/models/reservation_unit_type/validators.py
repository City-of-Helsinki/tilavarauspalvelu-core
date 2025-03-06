from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitType


__all__ = [
    "ReservationUnitTypeValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitTypeValidator:
    reservation_unit_type: ReservationUnitType
