from __future__ import annotations

import datetime
import zoneinfo
from typing import TYPE_CHECKING, Generic, Literal, TypedDict, TypeVar

from django.utils.timezone import get_default_timezone

if TYPE_CHECKING:
    from collections.abc import Generator

__all__ = [
    "DEFAULT_TIMEZONE",
    "combine",
    "compare_datetimes",
    "compare_times",
    "get_periods_between",
    "local_date",
    "local_date_string",
    "local_datetime",
    "local_datetime_max",
    "local_datetime_min",
    "local_end_of_day",
    "local_iso_format",
    "local_start_of_day",
    "local_time",
    "local_time_max",
    "local_time_min",
    "local_time_string",
    "local_timedelta_string",
    "next_hour",
    "time_as_timedelta",
    "time_difference",
    "timedelta_from_json",
    "timedelta_to_json",
    "utc_date",
    "utc_datetime",
    "utc_datetime_max",
    "utc_datetime_min",
    "utc_end_of_day",
    "utc_iso_format",
    "utc_start_of_day",
    "utc_time",
    "utc_time_max",
    "utc_time_min",
]

TCanHaveTZ = TypeVar("TCanHaveTZ", datetime.datetime, datetime.time)
TValid = TypeVar("TValid", datetime.datetime, datetime.time)


DEFAULT_TIMEZONE = get_default_timezone()


class _TZComparator(Generic[TCanHaveTZ, TValid]):  # noqa: N801, RUF100
    def __init__(self, _input_1: TCanHaveTZ, _input_2: TCanHaveTZ) -> None:
        self._input_1 = self._validate_input(_input_1, name="Input 1")
        self._input_2 = self._validate_input(_input_2, name="Input 2")

    def __bool__(self) -> bool:
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


def local_datetime(
    year: int | None = None,
    month: int | None = None,
    day: int | None = None,
    hour: int = 0,
    minute: int = 0,
    second: int = 0,
    microsecond: int = 0,
) -> datetime.datetime:
    """Get datetime in the local timezone. Without arguments, the current datetime is returned."""
    if all((year, month, day)):
        return datetime.datetime(year, month, day, hour, minute, second, microsecond, tzinfo=DEFAULT_TIMEZONE)
    if any((year, month, day)):
        raise ValueError("'year', 'month' and 'day' must be given together")
    return datetime.datetime.now(tz=DEFAULT_TIMEZONE)


def local_date(
    year: int | None = None,
    month: int | None = None,
    day: int | None = None,
) -> datetime.date:
    """Get date in the local timezone. Without arguments, the current date is returned."""
    return local_datetime(year, month, day).date()


def local_time(
    hour: int = 0,
    minute: int = 0,
    second: int = 0,
    microsecond: int = 0,
    *,
    date: datetime.date | None = None,
) -> datetime.time:
    """
    Get time in the local timezone on the given date (or today by default).
    Without arguments, the current time is returned.
    """
    if any((hour, minute, second, microsecond)):
        today = date or local_date()
        return local_datetime(today.year, today.month, today.day, hour, minute, second, microsecond).timetz()

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


def local_iso_format(_datetime: datetime.datetime, /) -> str:
    """Get the datetime in the local timezone in ISO format."""
    return _datetime.astimezone(DEFAULT_TIMEZONE).isoformat(timespec="seconds")


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


def next_hour(*, plus_minutes: int = 0, plus_hours: int = 0, plus_days: int = 0) -> datetime.datetime:
    """
    Return a timestamp for the next hour.

    Without any arguments, the timestamp will be for the next full hour,
    any additional arguments will be added to that.

    >>> datetime.datetime.now()
    2021-01-01 12:30:00

    >>> next_hour()
    13:00

    >>> next_hour(plus_hours=1, plus_minutes=30)
    14:30

    >>> next_hour(plus_hours=-1)
    12:00
    """
    now = local_datetime()
    start_of_hour = now.replace(minute=0, second=0, microsecond=0)
    return start_of_hour + datetime.timedelta(hours=1 + plus_hours, minutes=plus_minutes, days=plus_days)


### UTC TIME #############################################################################################


def utc_datetime(
    year: int | None = None,
    month: int | None = None,
    day: int | None = None,
    hour: int = 0,
    minute: int = 0,
    second: int = 0,
    microsecond: int = 0,
) -> datetime.datetime:
    """Get datetime in UTC. Without arguments, the current datetime is returned."""
    if all((year, month, day)):
        return datetime.datetime(year, month, day, hour, minute, second, microsecond, tzinfo=datetime.UTC)
    if any((year, month, day)):
        raise ValueError("'year', 'month' and 'day' must be given together")
    return datetime.datetime.now(tz=datetime.UTC)


def utc_date(
    year: int | None = None,
    month: int | None = None,
    day: int | None = None,
) -> datetime.date:
    """Get date in UTC. Without arguments, the current date is returned."""
    return utc_datetime(year, month, day).date()


def utc_time(
    hour: int = 0,
    minute: int = 0,
    second: int = 0,
    microsecond: int = 0,
    *,
    date: datetime.date | None = None,
) -> datetime.time:
    """Get time in UTC on the given date (or today by default). Without arguments, the current time is returned."""
    if any((hour, minute, second, microsecond)):
        today = date or local_date()
        return utc_datetime(today.year, today.month, today.day, hour, minute, second, microsecond).timetz()

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


def utc_end_of_day(_date: datetime.date | datetime.datetime, /) -> datetime.datetime:
    """Get the end of day (23:59:59) as datetime for the given date in UTC."""
    if isinstance(_date, datetime.datetime):
        _date = _date.astimezone(datetime.UTC).date()
    return datetime.datetime.combine(_date, datetime.time.max, tzinfo=datetime.UTC)


def utc_iso_format(_datetime: datetime.datetime, /) -> str:
    """Get the datetime in UTC in ISO format."""
    return _datetime.astimezone(datetime.UTC).isoformat(timespec="seconds")


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


def timedelta_to_json(delta: datetime.timedelta, *, timespec: Literal["minutes", "seconds"] = "seconds") -> str:
    result = str(delta).zfill(8)
    if timespec == "minutes":
        return result[:5]
    return result


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


def datetime_range_as_string(*, start_datetime: datetime.datetime, end_datetime: datetime.datetime) -> str:
    """Format a datetime range to a human readable string."""
    strformat = "%Y-%m-%d %H:%M"

    start_datetime = start_datetime.astimezone(DEFAULT_TIMEZONE)
    end_datetime = end_datetime.astimezone(DEFAULT_TIMEZONE)

    start_date = start_datetime.date()
    end_date = end_datetime.date()

    start_str = "min" if start_date == datetime.date.min else start_datetime.strftime(strformat)

    if end_date == datetime.date.max:
        end_str = "max"
    elif end_date == start_date:
        end_str = end_datetime.strftime("%H:%M")
    elif end_date == start_date + datetime.timedelta(days=1) and end_date == datetime.time.min:
        end_str = "24:00"
    else:
        end_str = end_datetime.strftime(strformat)

    return f"{start_str}-{end_str}"


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


def get_periods_between(
    start_date: datetime.date,
    end_date: datetime.date,
    start_time: datetime.time,
    end_time: datetime.time,
    *,
    interval: int = 7,
    tzinfo: zoneinfo.ZoneInfo | datetime.timezone | None = None,
) -> Generator[tuple[datetime.datetime, datetime.datetime], None, None]:
    """
    Generate datetimes based on the given start and end dates.

    Note: This will generate the times in such a way that the time will be the same after
          switching to daylight saving time and back.

    :param start_date: From which date to generate dates?
    :param end_date: Until which date to generate dates?
    :param start_time: Start time of a period.
    :param end_time: End time of a period.
    :param interval: Days between each period.
    :param tzinfo: Timezone information for the datetimes (if times are not datetime-aware yet).
    """
    if end_date < start_date:
        msg = "End date cannot be before start date."
        raise ValueError(msg)
    if end_date == start_date and end_time <= start_time and end_time != datetime.time(0, 0):
        msg = "End time cannot be at or before start time if on the same day."
        raise ValueError(msg)

    start_datetime = combine(start_date, start_time, tzinfo=tzinfo)
    if end_time == datetime.time(0, 0):
        # Handle cases where end time is at midnight
        end_datetime = combine(start_date + datetime.timedelta(days=1), end_time, tzinfo=tzinfo)
    else:
        end_datetime = combine(start_date, end_time, tzinfo=tzinfo)

    for delta in range(0, (end_date - start_date).days + 1, interval):
        yield start_datetime + datetime.timedelta(days=delta), end_datetime + datetime.timedelta(days=delta)


def normalize_as_datetime(value: datetime.date | datetime.datetime, *, timedelta_days: int = 0) -> datetime.datetime:
    if isinstance(value, datetime.datetime):
        return value
    # Convert dates to datetimes to include timezone information
    return combine(value, datetime.time.min, tzinfo=DEFAULT_TIMEZONE) + datetime.timedelta(days=timedelta_days)
