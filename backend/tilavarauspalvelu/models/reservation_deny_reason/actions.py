from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationDenyReason


class ReservationDenyReasonActions:
    def __init__(self, reservation_deny_reason: ReservationDenyReason) -> None:
        self.reservation_deny_reason = reservation_deny_reason
