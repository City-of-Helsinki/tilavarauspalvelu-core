from __future__ import annotations

from typing import TYPE_CHECKING, NamedTuple

if TYPE_CHECKING:
    from datetime import datetime


class ReservableTimeOutput(NamedTuple):
    is_closed: bool
    first_reservable_time: datetime | None
