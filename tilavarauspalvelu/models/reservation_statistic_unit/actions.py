from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationStatisticsReservationUnit


class ReservationStatisticsReservationUnitActions:
    def __init__(self, reservation_statistics_unit: "ReservationStatisticsReservationUnit") -> None:
        self.reservation_statistics_unit = reservation_statistics_unit
