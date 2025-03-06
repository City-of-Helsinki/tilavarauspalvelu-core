from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import AllocatedTimeSlot


__all__ = [
    "AllocatedTimeSlotValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AllocatedTimeSlotValidator:
    allocated_time_slot: AllocatedTimeSlot
