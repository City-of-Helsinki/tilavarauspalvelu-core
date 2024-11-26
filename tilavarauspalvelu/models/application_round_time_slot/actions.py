from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .model import ApplicationRoundTimeSlot


class ApplicationRoundTimeSlotActions:
    def __init__(self, application_round_time_slot: ApplicationRoundTimeSlot) -> None:
        self.application_round_time_slot = application_round_time_slot
