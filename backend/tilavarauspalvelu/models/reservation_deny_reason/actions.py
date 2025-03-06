from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationDenyReason


__all__ = [
    "ReservationDenyReasonActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationDenyReasonActions:
    reservation_deny_reason: ReservationDenyReason
