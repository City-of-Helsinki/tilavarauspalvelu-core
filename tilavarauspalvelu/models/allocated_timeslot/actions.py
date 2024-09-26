from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from tilavarauspalvelu.models import AllocatedTimeSlot


class AllocatedTimeSlotActions:
    def __init__(self, allocated_time_slot: "AllocatedTimeSlot") -> None:
        self.allocated_time_slot = allocated_time_slot
