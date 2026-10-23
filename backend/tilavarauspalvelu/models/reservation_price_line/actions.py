from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationPriceLine


__all__ = [
    "ReservationPriceLineActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationPriceLineActions:
    reservation_price_line: ReservationPriceLine
