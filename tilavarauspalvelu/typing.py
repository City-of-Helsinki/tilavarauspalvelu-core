import datetime
from typing import Literal, TypedDict


class permission(classmethod): ...  # noqa: N801


type M2MAction = Literal["pre_add", "post_add", "pre_remove", "post_remove", "pre_clear", "post_clear"]


class AffectedTimeSpan(TypedDict):
    start_datetime: str
    end_datetime: str
    buffer_time_before: str
    buffer_time_after: str
    is_blocking: bool


class TimeSlot(TypedDict):
    begin: datetime.time
    end: datetime.time


class TimeSlotDB(TypedDict):
    """
    Timeslots must be stored as string in HSField,
    but we want to use `datetime.time` in the code.
    """

    begin: str  # datetime.time
    end: str  # datetime.time
