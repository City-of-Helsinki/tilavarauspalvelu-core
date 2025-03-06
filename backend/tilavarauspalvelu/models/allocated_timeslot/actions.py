from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import AllocatedTimeSlot


__all__ = [
    "AllocatedTimeSlotActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AllocatedTimeSlotActions:
    allocated_time_slot: AllocatedTimeSlot
