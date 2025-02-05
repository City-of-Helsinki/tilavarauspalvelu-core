from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservableTimeSpan


class ReservableTimeSpanActions:
    def __init__(self, reservable_time_span: ReservableTimeSpan) -> None:
        self.reservable_time_span = reservable_time_span
