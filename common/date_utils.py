import datetime
import zoneinfo
from functools import singledispatch

from django.conf import settings

__all__ = [
    "local_timezone",
    "local_datetime",
    "local_date",
    "local_time",
    "local_time_min",
    "local_time_max",
    "utc_datetime",
    "utc_date",
    "utc_time",
    "utc_datetime_min",
    "utc_datetime_max",
    "utc_time_min",
    "utc_time_max",
    "combine",
    "datetimes_equal",
    "times_equal",
    "timedelta_to_json",
    "timedelta_from_json",
]


### LOCAL TIME ###########################################################################################


def local_timezone() -> datetime.timezone:
    """
    Fetch local timezone used to convert naive datetimes to aware datetimes.

    Cannot use `django.utils.timezone.get_default_timezone()`,
    because it returns a `zoneinfo.ZoneInfo` object, which when used together with
    `datetime.timezone` (e.g. datetime.UTC/datetime.timezone.utc) will not work as
    expected when comparing with `datetime.time` objects:

    ```python 3.11
    import zoneinfo
    import datetime

    tz = zoneinfo.ZoneInfo("Europe/Helsinki")

    dt_1 = datetime.datetime(2021, 1, 1, tzinfo=tz)
    dt_2 = datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC)

    assert dt_1 < dt_2  # Works as expected

    t_1 = datetime.time(tzinfo=tz)
    t_2 = datetime.time(tzinfo=datetime.UTC)

    assert t_1 < t_2  # raises "TypeError: can't compare offset-naive and offset-aware times"
    ```
    """
    return timezone_from_name(settings.TIME_ZONE)


def local_datetime() -> datetime.datetime:
    """Get current datetime in the local timezone."""
    return datetime.datetime.now(tz=local_timezone())


def local_date() -> datetime.date:
    """Get current date in the local timezone."""
    return local_datetime().date()


def local_time() -> datetime.time:
    """Get current time in the local timezone."""
    return local_datetime().timetz()


def local_datetime_min():
    """Get the minimum datetime of the day in the local timezone."""
    return datetime.datetime.min.replace(tzinfo=local_timezone())


def local_datetime_max():
    """Get the maximum datetime of the day in the local timezone."""
    return datetime.datetime.max.replace(tzinfo=local_timezone())


def local_time_min():
    """Get the minimum time of the day in the local timezone."""
    return datetime.time.min.replace(tzinfo=local_timezone())


def local_time_max():
    """Get the maximum time of the day in the local timezone."""
    return datetime.time.max.replace(tzinfo=local_timezone())


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


def utc_datetime_min():
    """Get the minimum datetime of the day in UTC."""
    return datetime.datetime.min.replace(tzinfo=datetime.UTC)


def utc_datetime_max():
    """Get the maximum datetime of the day in UTC."""
    return datetime.datetime.max.replace(tzinfo=datetime.UTC)


def utc_time_min():
    """Get the minimum time of the day in UTC."""
    return datetime.time.min.replace(tzinfo=datetime.UTC)


def utc_time_max():
    """Get the maximum time of the day in UTC."""
    return datetime.time.max.replace(tzinfo=datetime.UTC)


### COMMON UTILS #########################################################################################


def combine(date: datetime.date, time: datetime.time) -> datetime.datetime:
    """Combine a date and a timezone aware time to a datetime object."""
    if time.utcoffset() is None:
        raise ValueError("Time must be timezone-aware using `datetime.timezone` objects.")
    return datetime.datetime.combine(date, time)


def datetimes_equal(_dt_1: datetime.datetime, _dt_2: datetime.datetime, /, *, check_same_tz: bool = False) -> bool:
    """
    Check if two timezone-aware datetime objects are equal.

    This is needed because == / != checks for datetime objects don't check for timezone-awareness:

    ```python 3.11
    import zoneinfo
    import datetime

    tz = zoneinfo.ZoneInfo("Europe/Helsinki")

    dt_zi = datetime.datetime(2021, 1, 1, tzinfo=tz)
    dt_tz = datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC)
    dt_naive = datetime.datetime(2021, 1, 1)

    # There might not be true, since on datetime is timezone-aware and the other is not.
    assert dt_zi != dt_naive
    assert dt_tz != dt_naive
    ```
    """
    if _dt_1.utcoffset() is None:
        msg = "First datetime must be timezone-aware using `datetime.timezone` objects."
        raise ValueError(msg)
    if _dt_2.utcoffset() is None:
        msg = "Second datetime must be timezone-aware using `datetime.timezone` objects."
        raise ValueError(msg)
    if check_same_tz and _dt_1.tzname() != _dt_2.tzname():
        msg = f"Timezones of both datetimes must be the same. Got: {_dt_1.tzname()} and {_dt_2.tzname()}"
        raise ValueError(msg)
    return _dt_1 == _dt_2


def times_equal(_t_1: datetime.time, _t_2: datetime.time, /, *, check_same_tz: bool = False) -> bool:
    """
    Check if two timezone-aware time objects are equal.

    This is needed because == / != checks for time objects don't check for timezone-awareness,
    and / < / <= / > / >= checks can give false results if `zoneinfo.ZoneInfo` objects are used for `tzinfo`:

    ```python 3.11
    import zoneinfo
    import datetime

    tz = zoneinfo.ZoneInfo("Europe/Helsinki")

    t_zi = datetime.time(tzinfo=tz)
    t_tz = datetime.time(tzinfo=datetime.UTC)
    t_naive = datetime.time()

    assert t_zi >= t_naive  # Works
    assert t_zi <= t_naive  # Works??? This should be False, right?
    assert t_tz >= t_naive  # raises "TypeError: can't compare offset-naive and offset-aware times"
    ```
    """
    if _t_1.utcoffset() is None:
        msg = "First time must be timezone-aware using `datetime.timezone` objects."
        raise ValueError(msg)
    if _t_2.utcoffset() is None:
        msg = "Second time must be timezone-aware using `datetime.timezone` objects."
        raise ValueError(msg)
    if check_same_tz and _t_1.tzname() != _t_2.tzname():
        msg = f"Timezones of both times must be the same. Got: {_t_1.tzname()} and {_t_2.tzname()}"
        raise ValueError(msg)
    return _t_1 == _t_2


def timezone_from_name(name: str) -> datetime.timezone:
    """Get `datetime.timezone` from timezone name, e.g. "Europe/Helsinki"."""
    return datetime.timezone(
        zoneinfo.ZoneInfo(name).utcoffset(datetime.datetime.utcnow()),
        name=name,
    )


def timedelta_to_json(delta: datetime.timedelta) -> str:
    return str(delta).zfill(8)


def timedelta_from_json(delta: str) -> datetime.timedelta:
    try:
        time_ = datetime.datetime.strptime(delta, "%H:%M:%S")
    except ValueError:
        time_ = datetime.datetime.strptime(delta, "%H:%M")

    return datetime.timedelta(hours=time_.hour, minutes=time_.minute, seconds=time_.second)


@singledispatch
def time_as_timedelta(_input: datetime.datetime | datetime.time, /) -> datetime.timedelta:
    """Convert datetime/time to timedelta as measured form the start of the day."""
    raise TypeError(f"Unsupported type: {_input.__class__.__name__}")


@time_as_timedelta.register
def _(_input: datetime.datetime, /) -> datetime.timedelta:
    return _input - _input.replace(hour=0, minute=0, second=0, microsecond=0)


@time_as_timedelta.register
def _(_input: datetime.time, /) -> datetime.timedelta:
    return datetime.timedelta(
        hours=_input.hour,
        minutes=_input.minute,
        seconds=_input.second,
        microseconds=_input.microsecond,
    )
