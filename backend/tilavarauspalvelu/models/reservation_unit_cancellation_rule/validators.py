from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitCancellationRule


__all__ = [
    "ReservationUnitCancellationRuleValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ReservationUnitCancellationRuleValidator:
    reservation_unit_cancellation_rule: ReservationUnitCancellationRule
