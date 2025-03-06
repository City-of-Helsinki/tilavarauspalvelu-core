from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ReservationUnitCancellationRule


__all__ = [
    "ReservationUnitCancellationRuleActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitCancellationRuleActions:
    reservation_unit_cancellation_rule: ReservationUnitCancellationRule
