from __future__ import annotations

import datetime
from typing import TYPE_CHECKING, Literal, TypedDict

from django.utils.timezone import get_default_timezone

if TYPE_CHECKING:
    import zoneinfo
    from collections.abc import Generator

    from tilavarauspalvelu.enums import Weekday
    from tilavarauspalvelu.typing import Lang

__all__ = [
    "DEFAULT_TIMEZONE",
    "AwareTimeError",
    "NaiveDatetimeError",
    "add_elapsed_time",
    "from_iso_format",
    "get_date_range",
    "get_periods_between",
    "get_time_range",
    "local_add_days",
    "local_combine",
    "local_date",
    "local_date_of",
    "local_date_string",
    "local_datetime",
    "local_datetime_exists",
    "local_datetime_string",
    "local_end_of_day",
    "local_from_iso_format",
    "local_iso_format",
    "local_next_start_of_day",
    "local_start_of_day",
    "local_time",
    "local_time_string",
    "local_timedelta_string",
    "next_date_matching_weekday",
    "next_hour",
    "parse_naive_datetime",
    "time_as_timedelta",
    "time_difference",
    "timedelta_as_time",
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
]


# Python compares, adds and subtracts two datetimes in the same zone on the wall clock. This is wrong across
# a daylight saving time change, so do these in UTC, e.g. with 'add_elapsed_time' or 'datetime_difference'.
DEFAULT_TIMEZONE = get_default_timezone()


class NaiveDatetimeError(Exception):
    """A datetime has no timezone. Python would read it in the system timezone without an error."""


class AwareTimeError(Exception):
    """A time has a timezone. A time is a wall clock time, and only a date gives it an offset."""


# LOCAL TIME ###########################################################################################


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
        msg = "'year', 'month' and 'day' must be given together"
        raise ValueError(msg)
    return datetime.datetime.now(tz=DEFAULT_TIMEZONE)


def local_date(
    year: int | None = None,
    month: int | None = None,
    day: int | None = None,
) -> datetime.date:
    """Get date in the local timezone. Without arguments, the current date is returned."""
    return local_datetime(year, month, day).date()


def local_time(
    hour: int | None = None,
    minute: int | None = None,
    second: int | None = None,
    microsecond: int | None = None,
) -> datetime.time:
    """
    Get a wall clock time without a timezone, like a 'TimeField' value.
    Without arguments, the current time in the local timezone is returned.
    """
    if hour is None and minute is None and second is None and microsecond is None:
        return local_datetime().time()

    return datetime.time(hour or 0, minute or 0, second or 0, microsecond or 0)


def local_date_of(_datetime: datetime.datetime, /) -> datetime.date:
    """
    Get the local date of the given datetime.
    'datetime.date()' on a UTC datetime gives the previous date for 00:00-02:59 local time.
    """
    if _datetime.tzinfo is None:
        msg = "Cannot get the local date of a naive datetime."
        raise NaiveDatetimeError(msg)

    return _datetime.astimezone(DEFAULT_TIMEZONE).date()


def local_combine(_date: datetime.date, _time: datetime.time, /) -> datetime.datetime:
    """
    Combine a date and a wall clock time to a datetime in the local timezone.
    A time in the spring daylight saving time gap does not exist. Check it with 'local_datetime_exists'.
    """
    if _time.tzinfo is not None:
        msg = "Cannot combine a time that has a timezone."
        raise AwareTimeError(msg)

    return datetime.datetime.combine(_date, _time, tzinfo=DEFAULT_TIMEZONE)


def local_add_days(_datetime: datetime.datetime, /, *, days: int) -> datetime.datetime:
    """
    Add calendar days in the local timezone. The wall clock time stays the same across a daylight saving time change.
    A wall clock time in the spring gap moves forward by one hour.
    """
    if _datetime.tzinfo is None:
        msg = "Cannot add calendar days to a naive datetime."
        raise NaiveDatetimeError(msg)

    local_value = _datetime.astimezone(DEFAULT_TIMEZONE)

    # Datetime arithmetic resets 'fold', which moves a time in the repeated autumn hour to its first occurrence.
    if days == 0:
        return local_value

    moved = local_value + datetime.timedelta(days=days)

    # The round trip through UTC gives a time in the spring gap the offset that is valid after the change.
    moved_utc = moved.astimezone(datetime.UTC)
    return moved_utc.astimezone(DEFAULT_TIMEZONE)


def local_start_of_day(_date: datetime.date | datetime.datetime | None = None, /) -> datetime.datetime:
    """Get the start of day (00:00:00) as datetime for the given date (or today if not given) in local timezone."""
    if isinstance(_date, datetime.datetime):
        _date = local_date_of(_date)
    if _date is None:
        _date = local_date()
    return datetime.datetime.combine(_date, datetime.time.min, tzinfo=DEFAULT_TIMEZONE)


def local_next_start_of_day(_date: datetime.date | datetime.datetime | None = None, /) -> datetime.datetime:
    """
    Get the start of the next day (00:00:00) for the given date (or today if not given) in local timezone.
    Use it as the end of a day in a half-open range: 'begin <= value < end'.
    """
    if isinstance(_date, datetime.datetime):
        _date = local_date_of(_date)
    if _date is None:
        _date = local_date()
    next_date = _date + datetime.timedelta(days=1)
    return datetime.datetime.combine(next_date, datetime.time.min, tzinfo=DEFAULT_TIMEZONE)


def local_end_of_day(_date: datetime.date | datetime.datetime | None = None, /) -> datetime.datetime:
    """
    Get the end of day (23:59:59.999999) as datetime for the given date in local timezone.
    Use it with '<='. For the end of a range, use 'local_next_start_of_day' with '<'.
    """
    if isinstance(_date, datetime.datetime):
        _date = local_date_of(_date)
    if _date is None:
        _date = local_date()
    return datetime.datetime.combine(_date, datetime.time.max, tzinfo=DEFAULT_TIMEZONE)


def local_datetime_exists(_datetime: datetime.datetime, /) -> bool:
    """
    Check that the given datetime in the local timezone exists on the wall clock.
    The spring daylight saving time change skips the hour from 03:00 to 04:00.
    """
    datetime_utc = _datetime.astimezone(datetime.UTC)
    round_trip = datetime_utc.astimezone(DEFAULT_TIMEZONE)
    wall_clock = _datetime.replace(tzinfo=None)
    round_trip_wall_clock = round_trip.replace(tzinfo=None)
    return wall_clock == round_trip_wall_clock


def local_iso_format(_datetime: datetime.datetime, /) -> str:
    """Get the datetime in the local timezone in ISO format."""
    return _datetime.astimezone(DEFAULT_TIMEZONE).isoformat(timespec="seconds")


def local_from_iso_format(_string: str, /) -> datetime.datetime:
    """
    Get the datetime from ISO string in the local timezone.
    A string without an offset is read as local time.
    """
    return from_iso_format(_string, timezone=DEFAULT_TIMEZONE)


def local_datetime_string(_datetime: datetime.datetime, /, *, seconds: bool = False) -> str:
    """Get the datetime in the local timezone in "the Finnish" datetime format."""
    fmt = "%-d.%-m.%Y %-H:%M"
    if seconds:
        fmt += ":%S"
    return _datetime.astimezone(DEFAULT_TIMEZONE).strftime(fmt)


def local_date_string(_date: datetime.date, /) -> str:
    """Format a date to a string in "the Finnish" local format."""
    return _date.strftime("%-d.%-m.%Y")


def local_time_string(_time: datetime.time, /, *, seconds: bool = False) -> str:
    """Format a time to a string in "the Finnish" local format."""
    fmt = "%-H:%M"
    if seconds:
        fmt += ":%S"
    return _time.strftime(fmt)


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

    return duration_string.strip()


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
    # The local timezone has whole hour offsets, so the start of an hour in UTC is also the start of a local hour.
    now = utc_datetime()
    start_of_hour = now.replace(minute=0, second=0, microsecond=0)
    moved = start_of_hour + datetime.timedelta(hours=1 + plus_hours, minutes=plus_minutes)
    return local_add_days(moved, days=plus_days)


# UTC TIME #############################################################################################


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
        msg = "'year', 'month' and 'day' must be given together"
        raise ValueError(msg)
    return datetime.datetime.now(tz=datetime.UTC)


def utc_date(
    year: int | None = None,
    month: int | None = None,
    day: int | None = None,
) -> datetime.date:
    """Get date in UTC. Without arguments, the current date is returned."""
    return utc_datetime(year, month, day).date()


def utc_time() -> datetime.time:
    """Get the current wall clock time in UTC, without a timezone."""
    return utc_datetime().time()


def utc_datetime_min() -> datetime.datetime:
    """Get the minimum datetime of the day in UTC."""
    return datetime.datetime.min.replace(tzinfo=datetime.UTC)


def utc_datetime_max() -> datetime.datetime:
    """Get the maximum datetime of the day in UTC."""
    return datetime.datetime.max.replace(tzinfo=datetime.UTC)


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


# COMMON UTILS #########################################################################################


def add_elapsed_time(_datetime: datetime.datetime, /, *, delta: datetime.timedelta) -> datetime.datetime:
    """
    Add real elapsed time, and keep the timezone of the given datetime.
    A plain '+' on a datetime in the local timezone adds on the wall clock. This is wrong across a DST change.
    """
    if _datetime.tzinfo is None:
        msg = "Cannot add elapsed time to a naive datetime."
        raise NaiveDatetimeError(msg)

    moved_utc = _datetime.astimezone(datetime.UTC) + delta
    return moved_utc.astimezone(_datetime.tzinfo)


def from_iso_format(_string: str, /, *, timezone: zoneinfo.ZoneInfo | datetime.timezone) -> datetime.datetime:
    """
    Get the datetime from ISO string in the given timezone.
    A string with an offset keeps its moment. A string without an offset is read as a wall clock time in the timezone.
    """
    value = datetime.datetime.fromisoformat(_string)
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone)
    return value.astimezone(timezone)


def parse_naive_datetime(
    _string: str,
    /,
    *,
    string_format: str,
    timezone: zoneinfo.ZoneInfo | datetime.timezone,
) -> datetime.datetime:
    """Parse a string without an offset as a wall clock time in the given timezone."""
    value = datetime.datetime.strptime(_string, string_format)  # noqa: DTZ007
    return value.replace(tzinfo=timezone)


def timedelta_to_json(delta: datetime.timedelta, *, timespec: Literal["minutes", "seconds"] = "seconds") -> str:
    """Format a timedelta as '[-]HH:MM:SS' or '[-]HH:MM'. The hours count the whole duration, not only one day."""
    total_seconds = int(delta.total_seconds())
    sign = "-" if total_seconds < 0 else ""
    hours, remaining_seconds = divmod(abs(total_seconds), 3600)
    minutes, seconds = divmod(remaining_seconds, 60)

    if timespec == "minutes":
        return f"{sign}{hours:02}:{minutes:02}"
    return f"{sign}{hours:02}:{minutes:02}:{seconds:02}"


def timedelta_from_json(delta: str) -> datetime.timedelta:
    try:
        time_ = datetime.datetime.strptime(delta, "%H:%M:%S")  # noqa: DTZ007
    except ValueError:
        time_ = datetime.datetime.strptime(delta, "%H:%M")  # noqa: DTZ007

    return datetime.timedelta(hours=time_.hour, minutes=time_.minute, seconds=time_.second)


def time_as_timedelta(_input: datetime.datetime | datetime.time, /) -> datetime.timedelta:
    """Convert datetime/time to timedelta as measured form the start of the day."""
    return datetime.timedelta(
        hours=_input.hour,
        minutes=_input.minute,
        seconds=_input.second,
        microseconds=_input.microsecond,
    )


def end_time_as_timedelta(_input: datetime.time, /) -> datetime.timedelta:
    """Convert an end time to timedelta as measured from the start of the day. Midnight is the end of the day."""
    if _input == datetime.time():
        return datetime.timedelta(hours=24)
    return time_as_timedelta(_input)


def timedelta_as_time(_input: datetime.timedelta, /) -> datetime.time:
    """Convert timedelta to time as measured form the start of the day."""
    time_seconds = _input.total_seconds()
    return datetime.time(
        hour=int(time_seconds // 3600),
        minute=int(time_seconds // 60) % 60,
        second=int(time_seconds) % 60,
        microsecond=int((time_seconds % 1) * 1_000_000),
    )


def datetime_range_as_string(*, start_datetime: datetime.datetime, end_datetime: datetime.datetime) -> str:
    """Format a datetime range to a human readable string."""
    strformat = "%Y-%m-%d %H:%M"

    # Check the max date before the conversion, since the maximum datetime in UTC overflows in the local timezone.
    is_end_max = end_datetime.date() == datetime.date.max

    start_datetime = start_datetime.astimezone(DEFAULT_TIMEZONE)
    start_date = start_datetime.date()

    start_str = "min" if start_date == datetime.date.min else start_datetime.strftime(strformat)

    if is_end_max:
        end_str = "max"
    else:
        end_datetime = end_datetime.astimezone(DEFAULT_TIMEZONE)
        end_date = end_datetime.date()

        if end_date == start_date:
            end_str = end_datetime.strftime("%H:%M")
        elif end_date == start_date + datetime.timedelta(days=1) and end_datetime.time() == datetime.time.min:
            end_str = "24:00"
        else:
            end_str = end_datetime.strftime(strformat)

    return f"{start_str}-{end_str}"


def time_difference(_from: datetime.time, _to: datetime.time, /) -> datetime.timedelta:
    """Difference between two times as a timedelta."""
    return end_time_as_timedelta(_to) - time_as_timedelta(_from)


def datetime_difference(*, start_datetime: datetime.datetime, end_datetime: datetime.datetime) -> datetime.timedelta:
    """Elapsed time between two datetimes. This is correct across a daylight saving time change."""
    return end_datetime.astimezone(datetime.UTC) - start_datetime.astimezone(datetime.UTC)


class TimeSlot(TypedDict):
    begin_time: datetime.time
    end_time: datetime.time


def merge_time_slots(time_slots: list[TimeSlot]) -> list[TimeSlot]:
    """
    Merge time slots that overlap or touch each other.
    Time slots should be in chronological order, and on the same day.
    An end time of 00:00 is the end of the day.
    """
    merged_slots = time_slots[:1]

    # Go through all periods in order.
    for period in time_slots[1:]:
        last_period = merged_slots[-1]
        # If time periods overlap, or are next to each other -> merge them and continue.
        if end_time_as_timedelta(last_period["end_time"]) >= time_as_timedelta(period["begin_time"]):
            last_period["end_time"] = max(period["end_time"], last_period["end_time"], key=end_time_as_timedelta)
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
    tzinfo: zoneinfo.ZoneInfo | datetime.timezone,
    interval: int = 7,
) -> Generator[tuple[datetime.datetime, datetime.datetime]]:
    """
    Generate datetimes based on the given start and end dates (both inclusive).

    Note: This will generate the times in such a way that the time will be the same after
          switching to daylight saving time and back.

    :param start_date: From which date to generate dates?
    :param end_date: Until which date to generate dates?
    :param start_time: Start time of a period.
    :param end_time: End time of a period.
    :param interval: Days between each period.
    :param tzinfo: Timezone information for the datetimes.
    """
    if end_date < start_date:
        msg = "End date cannot be before start date."
        raise ValueError(msg)
    if end_time <= start_time and end_time != datetime.time(0, 0):
        msg = "End time cannot be at or before start time."
        raise ValueError(msg)

    start_datetime = datetime.datetime.combine(start_date, start_time, tzinfo=tzinfo)
    if end_time == datetime.time(0, 0):
        # Handle cases where end time is at midnight
        end_datetime = datetime.datetime.combine(start_date + datetime.timedelta(days=1), end_time, tzinfo=tzinfo)
    else:
        end_datetime = datetime.datetime.combine(start_date, end_time, tzinfo=tzinfo)

    for delta in range(0, (end_date - start_date).days + 1, interval):
        yield start_datetime + datetime.timedelta(days=delta), end_datetime + datetime.timedelta(days=delta)


def get_date_range(
    start_date: datetime.date,
    *,
    number: int,
) -> Generator[datetime.date]:
    """
    Generate dates from the given start date (inclusive) until the given number of dates have been generated.

    :param start_date: From which date to generate dates?
    :param number: How many dates to generate?
    """
    for delta in range(number):
        yield start_date + datetime.timedelta(days=delta)


def get_time_range(
    start_time: datetime.time,
    end_time: datetime.time,
    *,
    delta_seconds: int = 3600,  # 1 hour
) -> Generator[datetime.time]:
    """
    Generate times from the given start time (inclusive)
    for every given number of seconds (default: 1 hour)
    until the given end time (exclusive).
    """
    if start_time > end_time:
        msg = "End time cannot be before start time."
        raise ValueError(msg)

    current = time_as_timedelta(start_time)
    end_at = time_as_timedelta(end_time)

    while current < end_at:
        yield timedelta_as_time(current)
        current += datetime.timedelta(seconds=delta_seconds)


def normalize_as_datetime(value: datetime.date | datetime.datetime, *, timedelta_days: int = 0) -> datetime.datetime:
    if isinstance(value, datetime.datetime):
        return value

    # Convert dates to datetimes to include timezone information
    delta = datetime.timedelta(days=timedelta_days)
    return datetime.datetime.combine(value, datetime.time.min, tzinfo=DEFAULT_TIMEZONE) + delta


def next_date_matching_weekday(date: datetime.date, weekday: Weekday) -> datetime.date:
    """Return the next date from given one matching the given weekday."""
    delta = weekday.as_weekday_number - date.weekday()
    if delta < 0:
        delta += 7

    return date + datetime.timedelta(days=delta)


def localized_short_weekday(weekday: int, lang_code: Lang) -> str:
    weekdays = {
        "fi": ["Ma", "Ti", "Ke", "To", "Pe", "La", "Su"],
        "sv": ["Må", "Ti", "On", "To", "Fr", "Lö", "Sö"],
        "en": ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
    }

    if lang_code.lower() not in weekdays:
        lang_code = "fi"

    return weekdays[lang_code][weekday]
