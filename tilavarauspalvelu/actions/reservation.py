from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from reservation_units.models import ReservationUnit
    from reservations.models import Reservation


class ReservationActions:
    def __init__(self, reservation: Reservation) -> None:
        self.reservation = reservation

    def get_actual_before_buffer(self) -> datetime.timedelta:
        buffer_time_before: datetime.timedelta = self.reservation.buffer_time_before or datetime.timedelta()
        reservation_unit: ReservationUnit
        for reservation_unit in self.reservation.reservation_unit.all():
            before = reservation_unit.actions.get_actual_before_buffer(self.reservation.begin)
            buffer_time_before = max(before, buffer_time_before)
        return buffer_time_before

    def get_actual_after_buffer(self) -> datetime.timedelta:
        buffer_time_after: datetime.timedelta = self.reservation.buffer_time_after or datetime.timedelta()
        reservation_unit: ReservationUnit
        for reservation_unit in self.reservation.reservation_unit.all():
            after = reservation_unit.actions.get_actual_after_buffer(self.reservation.end)
            buffer_time_after = max(after, buffer_time_after)
        return buffer_time_after
