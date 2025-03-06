from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationCancelReason


__all__ = [
    "ReservationCancelReasonActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationCancelReasonActions:
    reservation_cancel_reason: ReservationCancelReason
