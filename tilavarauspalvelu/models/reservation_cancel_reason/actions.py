from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationCancelReason


class ReservationCancelReasonActions:
    def __init__(self, reservation_cancel_reason: "ReservationCancelReason") -> None:
        self.reservation_cancel_reason = reservation_cancel_reason
