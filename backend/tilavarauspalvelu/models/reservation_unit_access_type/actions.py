from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitAccessType


__all__ = [
    "ReservationUnitAccessTypeActions",
]


@dataclasses.dataclass(frozen=True, slots=True)
class ReservationUnitAccessTypeActions:
    access_type: ReservationUnitAccessType
