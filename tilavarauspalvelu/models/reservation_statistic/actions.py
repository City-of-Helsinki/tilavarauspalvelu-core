from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationStatistic


class ReservationStatisticActions:
    def __init__(self, reservation_statistic: "ReservationStatistic") -> None:
        self.reservation_statistic = reservation_statistic
