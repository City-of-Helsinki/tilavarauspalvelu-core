from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitOption


__all__ = [
    "ReservationUnitOptionActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitOptionActions:
    reservation_unit_options: ReservationUnitOption
