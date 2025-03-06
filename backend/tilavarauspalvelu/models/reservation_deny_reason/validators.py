from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationDenyReason


__all__ = [
    "ReservationDenyReasonValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationDenyReasonValidator:
    reservation_deny_reason: ReservationDenyReason
