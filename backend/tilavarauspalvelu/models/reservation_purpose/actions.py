from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationPurpose


class ReservationPurposeActions:
    def __init__(self, reservation_purpose: ReservationPurpose) -> None:
        self.reservation_purpose = reservation_purpose
