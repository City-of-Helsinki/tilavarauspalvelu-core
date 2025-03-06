from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRoundTimeSlot


__all__ = [
    "ApplicationRoundTimeSlotValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class ApplicationRoundTimeSlotValidator:
    application_round_time_slot: ApplicationRoundTimeSlot
