from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservableTimeSpan


__all__ = [
    "ReservableTimeSpanValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservableTimeSpanValidator:
    reservable_time_span: ReservableTimeSpan
