from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationPurpose


__all__ = [
    "ReservationPurposeActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationPurposeActions:
    reservation_purpose: ReservationPurpose
