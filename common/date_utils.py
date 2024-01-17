import datetime
import zoneinfo
from typing import Generic, TypeVar

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
            raise ValueError(msg)

        if not (_input.tzinfo == datetime.UTC or isinstance(_input.tzinfo, zoneinfo.ZoneInfo)):
            msg = f"{name} must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
            raise ValueError(msg)

        return _input


class compare_times(_TZComparator[datetime.datetime | datetime.time, datetime.time]):  # noqa: N801, RUF100
    @staticmethod
    def _validate_input(_input: datetime.datetime | datetime.time, *, name: str) -> datetime.time:
        if not isinstance(_input, datetime.datetime | datetime.time):
            msg = f"{name} must be a `datetime.datetime` or `datetime.time` object."
            raise ValueError(msg)

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
                raise ValueError(msg)

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


def local_datetime_min():
    """Get the minimum datetime of the day in the local timezone."""
    return datetime.datetime.min.replace(tzinfo=DEFAULT_TIMEZONE)


def local_datetime_max():
    """Get the maximum datetime of the day in the local timezone."""
    return datetime.datetime.max.replace(tzinfo=DEFAULT_TIMEZONE)


def local_time_min():
    """Get the minimum time of the day in the local timezone."""
    return datetime.time.min.replace(tzinfo=DEFAULT_TIMEZONE)


def local_time_max():
    """Get the maximum time of the day in the local timezone."""
    return datetime.time.max.replace(tzinfo=DEFAULT_TIMEZONE)


def local_start_of_day(_date: datetime.date | datetime.datetime, /) -> datetime.datetime:
    """Get the start of day (00:00:00) as datetime for the given date in local timezone."""
    if isinstance(_date, datetime.datetime):
        _date = _date.astimezone(DEFAULT_TIMEZONE).date()
    return datetime.datetime.combine(_date, datetime.time.min, tzinfo=DEFAULT_TIMEZONE)


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


def utc_start_of_day(_date: datetime.date, /) -> datetime.datetime:
    """Get the start of day (00:00:00) as datetime for the given date in UTC."""
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
