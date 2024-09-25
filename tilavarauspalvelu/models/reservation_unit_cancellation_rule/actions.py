from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitCancellationRule


class ReservationUnitCancellationRuleActions:
    def __init__(self, reservation_unit_cancellation_rule: "ReservationUnitCancellationRule") -> None:
        self.reservation_unit_cancellation_rule = reservation_unit_cancellation_rule
