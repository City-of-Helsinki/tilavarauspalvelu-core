from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationCancelReason


__all__ = [
    "ReservationCancelReasonValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationCancelReasonValidator:
    reservation_cancel_reason: ReservationCancelReason
