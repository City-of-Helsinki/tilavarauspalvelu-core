from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.typing import error_codes
from utils.date_utils import end_time_as_timedelta, time_as_timedelta

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import SuitableTimeRange


__all__ = [
    "SuitableTimeRangeValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class SuitableTimeRangeValidator:
    suitable_time_range: SuitableTimeRange

    @classmethod
    def validate_begin_time_before_end_time(cls, *, begin_time: datetime.time, end_time: datetime.time) -> None:
        begin_delta = time_as_timedelta(begin_time)
        end_delta = end_time_as_timedelta(end_time)
        if begin_delta >= end_delta:
            msg = "Suitable time range begin time must be before its end time."
            code = error_codes.APPLICATION_SECTION_SUITABLE_TIME_RANGE_BEGIN_TIME_AFTER_END_TIME
            raise ValidationError(msg, code=code)
