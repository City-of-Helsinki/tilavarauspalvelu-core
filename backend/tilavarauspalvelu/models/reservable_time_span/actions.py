from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservableTimeSpan


__all__ = [
    "ReservableTimeSpanActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservableTimeSpanActions:
    reservable_time_span: ReservableTimeSpan
