from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitAccessType


__all__ = [
    "ReservationUnitAccessTypeValidator",
]


@dataclasses.dataclass(frozen=True, slots=True)
class ReservationUnitAccessTypeValidator:
    access_type: ReservationUnitAccessType
