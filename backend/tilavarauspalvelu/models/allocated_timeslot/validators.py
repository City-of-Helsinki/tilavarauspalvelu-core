from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes
from utils.date_utils import end_time_as_timedelta, time_as_timedelta

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import AllocatedTimeSlot


__all__ = [
    "AllocatedTimeSlotValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class AllocatedTimeSlotValidator:
    allocated_time_slot: AllocatedTimeSlot

    @classmethod
    def validate_begin_time_before_end_time(cls, *, begin_time: datetime.time, end_time: datetime.time) -> None:
        begin_delta = time_as_timedelta(begin_time)
        end_delta = end_time_as_timedelta(end_time)
        if begin_delta >= end_delta:
            msg = "Allocation begin time must be before its end time."
            raise ValidationError(msg, code=error_codes.ALLOCATION_BEGIN_TIME_AFTER_END_TIME)
