import datetime
from typing import TypedDict


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
