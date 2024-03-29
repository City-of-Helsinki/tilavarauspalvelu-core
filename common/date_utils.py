import datetime
import zoneinfo
from typing import Generic, TypedDict, TypeVar

from django.utils.timezone import get_default_timezone

TCanHaveTZ = TypeVar("TCanHaveTZ", datetime.datetime, datetime.time)
TValid = TypeVar("TValid", datetime.datetime, datetime.time)

__all__ = [
    "DEFAULT_TIMEZONE",
    "compare_datetimes",
    "compare_times",
    "local_datetime",
    "local_date",
    "local_time",
    "local_datetime_min",
    "local_datetime_max",
    "local_time_min",
    "local_time_max",
    "local_start_of_day",
    "local_end_of_day",
    "local_date_string",
    "local_time_string",
    "local_timedelta_string",
    "utc_datetime",
    "utc_date",
    "utc_time",
    "utc_datetime_min",
    "utc_datetime_max",
    "utc_time_min",
    "utc_time_max",
    "utc_start_of_day",
    "combine",
    "timedelta_to_json",
    "timedelta_from_json",
    "time_as_timedelta",
    "time_difference",
]


DEFAULT_TIMEZONE = get_default_timezone()


class _TZComparator(Generic[TCanHaveTZ, TValid]):  # noqa: N801, RUF100
    def __init__(self, _input_1: TCanHaveTZ, _input_2: TCanHaveTZ):
        self._input_1 = self._validate_input(_input_1, name="Input 1")
        self._input_2 = self._validate_input(_input_2, name="Input 2")

    def __bool__(self):
        msg = f"Cannot compare '{self.__class__.__name__}' object directly. Did you forget to call a comparison method?"
        raise RuntimeError(msg)

    @staticmethod
    def _validate_input(_input: TCanHaveTZ, *, name: str) -> TValid:
        raise NotImplementedError

    def is_lte(self) -> bool:
        return self._input_1 <= self._input_2

    def is_gte(self) -> bool:
        return self._input_1 >= self._input_2

    def is_lt(self) -> bool:
        return self._input_1 < self._input_2

    def is_gt(self) -> bool:
        return self._input_1 > self._input_2

    def is_equal(self) -> bool:
        return self._input_1 == self._input_2

    def is_not_equal(self) -> bool:
        return self._input_1 != self._input_2


class compare_datetimes(_TZComparator[datetime.datetime, datetime.datetime]):  # noqa: N801, RUF100
    @staticmethod
    def _validate_input(_input: datetime.datetime, *, name: str) -> datetime.datetime:
        if not isinstance(_input, datetime.datetime):
            msg = f"{name} must be a `datetime.datetime` object."
            raise TypeError(msg)

        if not (_input.tzinfo == datetime.UTC or isinstance(_input.tzinfo, zoneinfo.ZoneInfo)):
            msg = f"{name} must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
            raise ValueError(msg)

        return _input


class compare_times(_TZComparator[datetime.datetime | datetime.time, datetime.time]):  # noqa: N801, RUF100
    @staticmethod
    def _validate_input(_input: datetime.datetime | datetime.time, *, name: str) -> datetime.time:
        if not isinstance(_input, datetime.datetime | datetime.time):
            msg = f"{name} must be a `datetime.datetime` or `datetime.time` object."
            raise TypeError(msg)

        if not (_input.tzinfo == datetime.UTC or isinstance(_input.tzinfo, zoneinfo.ZoneInfo)):
            msg = f"{name} must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
            raise ValueError(msg)

        if isinstance(_input, datetime.time):
            if _input.tzinfo == datetime.UTC:
                _input = _input.replace(tzinfo=None)

            if isinstance(_input.tzinfo, zoneinfo.ZoneInfo):
                msg = (
                    f"{name} cannot be a timezone-aware time using `zoneinfo.ZoneInfo` objects, "
                    f"since there is no way to know if the time is in daylight savings time or not."
                )
                raise TypeError(msg)

        if isinstance(_input, datetime.datetime):
            _input = _input.astimezone(datetime.UTC).time()
        return _input


### LOCAL TIME ###########################################################################################


def local_datetime() -> datetime.datetime:
    """Get current datetime in the local timezone."""
    return datetime.datetime.now(tz=DEFAULT_TIMEZONE)


def local_date() -> datetime.date:
    """Get current date in the local timezone."""
    return local_datetime().date()


def local_time() -> datetime.time:
    """Get current time in the local timezone."""
    return local_datetime().timetz()


def local_datetime_min() -> datetime.datetime:
    """Get the minimum datetime of the day in the local timezone."""
    return datetime.datetime.min.replace(tzinfo=DEFAULT_TIMEZONE)


def local_datetime_max() -> datetime.datetime:
    """Get the maximum datetime of the day in the local timezone."""
    return datetime.datetime.max.replace(tzinfo=DEFAULT_TIMEZONE)


def local_time_min() -> datetime.time:
    """Get the minimum time of the day in the local timezone."""
    return datetime.time.min.replace(tzinfo=DEFAULT_TIMEZONE)


def local_time_max() -> datetime.time:
    """Get the maximum time of the day in the local timezone."""
    return datetime.time.max.replace(tzinfo=DEFAULT_TIMEZONE)


def local_start_of_day(_date: datetime.date | datetime.datetime | None = None, /) -> datetime.datetime:
    """Get the start of day (00:00:00) as datetime for the given date (or today if not given) in local timezone."""
    if isinstance(_date, datetime.datetime):
        _date = _date.astimezone(DEFAULT_TIMEZONE).date()
    if _date is None:
        _date = local_date()
    return datetime.datetime.combine(_date, datetime.time.min, tzinfo=DEFAULT_TIMEZONE)


def local_end_of_day(_date: datetime.date | datetime.datetime, /) -> datetime.datetime:
    """Get the end of day (23:59:59) as datetime for the given date in local timezone."""
    if isinstance(_date, datetime.datetime):
        _date = _date.astimezone(DEFAULT_TIMEZONE).date()
    return datetime.datetime.combine(_date, datetime.time.max, tzinfo=DEFAULT_TIMEZONE)


def local_date_string(_date: datetime.date, /) -> str:
    """Format a date to a string in the finnish local format."""
    return _date.strftime("%d.%m.%Y")


def local_time_string(_time: datetime.time, /) -> str:
    """Format a time to a string in the finnish local format."""
    return _time.strftime("%H:%M")


def local_timedelta_string(delta: datetime.timedelta, /) -> str:
    """Format a timedelta to a string in the format, e.g., '2 h 22 min 5 s'."""
    total_seconds = int(delta.total_seconds())
    hours, remaining_seconds = divmod(total_seconds, 3600)
    minutes, seconds = divmod(remaining_seconds, 60)

    duration_string: str = ""
    if hours:
        duration_string += f"{hours} h"
    if minutes:
        duration_string += f" {minutes} min"
    if seconds:
        duration_string += f" {seconds} s"

    return duration_string


### UTC TIME #############################################################################################


def utc_datetime() -> datetime.datetime:
    """Get current datetime in UTC."""
    return datetime.datetime.now(tz=datetime.UTC)


def utc_date() -> datetime.date:
    """Get current date in UTC."""
    return utc_datetime().date()


def utc_time() -> datetime.time:
    """Get current time in UTC."""
    return utc_datetime().timetz()


def utc_datetime_min() -> datetime.datetime:
    """Get the minimum datetime of the day in UTC."""
    return datetime.datetime.min.replace(tzinfo=datetime.UTC)


def utc_datetime_max() -> datetime.datetime:
    """Get the maximum datetime of the day in UTC."""
    return datetime.datetime.max.replace(tzinfo=datetime.UTC)


def utc_time_min() -> datetime.time:
    """Get the minimum time of the day in UTC."""
    return datetime.time.min.replace(tzinfo=datetime.UTC)


def utc_time_max() -> datetime.time:
    """Get the maximum time of the day in UTC."""
    return datetime.time.max.replace(tzinfo=datetime.UTC)


def utc_start_of_day(_date: datetime.date | datetime.datetime | None = None, /) -> datetime.datetime:
    """Get the start of day (00:00:00) as datetime for the given date (of today if None) in UTC."""
    if isinstance(_date, datetime.datetime):
        _date = _date.astimezone(datetime.UTC).date()
    if _date is None:
        _date = utc_date()
    return datetime.datetime.combine(_date, datetime.time.min, tzinfo=datetime.UTC)


### COMMON UTILS #########################################################################################


def combine(
    date: datetime.date,
    time: datetime.time,
    *,
    tzinfo: zoneinfo.ZoneInfo | datetime.timezone | None = None,
) -> datetime.datetime:
    """Combine a date and a timezone aware time to a datetime object."""
    if tzinfo is None and not (time.tzinfo == datetime.UTC or isinstance(time.tzinfo, zoneinfo.ZoneInfo)):
        msg = "Must give `tzinfo` or time must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
        raise ValueError(msg)

    return datetime.datetime.combine(date, time, tzinfo=time.tzinfo or tzinfo)


def timedelta_to_json(delta: datetime.timedelta) -> str:
    return str(delta).zfill(8)


def timedelta_from_json(delta: str) -> datetime.timedelta:
    try:
        time_ = datetime.datetime.strptime(delta, "%H:%M:%S")
    except ValueError:
        time_ = datetime.datetime.strptime(delta, "%H:%M")

    return datetime.timedelta(hours=time_.hour, minutes=time_.minute, seconds=time_.second)


def time_as_timedelta(_input: datetime.datetime | datetime.time, /) -> datetime.timedelta:
    """Convert datetime/time to timedelta as measured form the start of the day."""
    return datetime.timedelta(
        hours=_input.hour,
        minutes=_input.minute,
        seconds=_input.second,
        microseconds=_input.microsecond,
    )


def time_difference(
    _input_1: datetime.datetime | datetime.time,
    _input_2: datetime.datetime | datetime.time,
    /,
) -> datetime.timedelta:
    """Difference between two datetimes/times as timedelta."""
    return time_as_timedelta(_input_1) - time_as_timedelta(_input_2)


class TimeSlot(TypedDict):
    begin_time: datetime.time
    end_time: datetime.time


def merge_time_slots(time_slots: list[TimeSlot]) -> list[TimeSlot]:
    """
    Merge time slots that overlap or touch each other.
    Time slots should be in chronological order, and on the same day.
    """
    merged_slots = time_slots[:1]

    # Go through all periods in order.
    for period in time_slots[1:]:
        last_period = merged_slots[-1]
        # If time periods overlap, or are next to each other -> merge them and continue.
        if last_period["end_time"] >= period["begin_time"]:
            last_period["end_time"] = max(period["end_time"], last_period["end_time"])
            continue

        # Otherwise the periods are not contiguous -> append the period and continue.
        merged_slots.append(period)
    return merged_slots
