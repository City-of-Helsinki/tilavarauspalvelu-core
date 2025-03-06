from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ApplicationRoundTimeSlot


__all__ = [
    "ApplicationRoundTimeSlotActions",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationRoundTimeSlotActions:
    application_round_time_slot: ApplicationRoundTimeSlot
