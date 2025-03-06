from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitImage


__all__ = [
    "ReservationUnitImageActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitImageActions:
    reservation_unit_image: ReservationUnitImage
