from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitOption


__all__ = [
    "ReservationUnitOptionValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitOptionValidator:
    reservation_unit_option: ReservationUnitOption
