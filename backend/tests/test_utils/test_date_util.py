from __future__ import annotations

import datetime
import zoneinfo
from typing import TYPE_CHECKING, NamedTuple

import freezegun
import pytest
from graphene_django_extensions.testing import parametrize_helper

from utils.date_utils import (
    DEFAULT_TIMEZONE,
    AwareTimeError,
    NaiveDatetimeError,
    add_elapsed_time,
    datetime_difference,
    datetime_range_as_string,
    from_iso_format,
    get_periods_between,
    local_add_days,
    local_combine,
    local_date,
    local_date_of,
    local_datetime,
    local_datetime_exists,
    local_from_iso_format,
    local_next_start_of_day,
    local_time,
    localized_short_weekday,
    next_hour,
    parse_naive_datetime,
    utc_date,
    utc_datetime,
    utc_datetime_max,
    utc_datetime_min,
    utc_time,
)

from tests.helpers import exact

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import Lang


def test_localized_short_weekday_fi() -> None:
    lang_code: Lang = "fi"
    assert localized_short_weekday(0, lang_code) == "Ma"
    assert localized_short_weekday(1, lang_code) == "Ti"
    assert localized_short_weekday(2, lang_code) == "Ke"
    assert localized_short_weekday(3, lang_code) == "To"
    assert localized_short_weekday(4, lang_code) == "Pe"
    assert localized_short_weekday(5, lang_code) == "La"
    assert localized_short_weekday(6, lang_code) == "Su"


def test_localized_short_weekday_sv() -> None:
    lang_code: Lang = "sv"
    assert localized_short_weekday(0, lang_code) == "Må"
    assert localized_short_weekday(1, lang_code) == "Ti"
    assert localized_short_weekday(2, lang_code) == "On"
    assert localized_short_weekday(3, lang_code) == "To"
    assert localized_short_weekday(4, lang_code) == "Fr"
    assert localized_short_weekday(5, lang_code) == "Lö"
    assert localized_short_weekday(6, lang_code) == "Sö"


def test_localized_short_weekday_en() -> None:
    lang_code: Lang = "en"
    assert localized_short_weekday(0, lang_code) == "Mo"
    assert localized_short_weekday(1, lang_code) == "Tu"
    assert localized_short_weekday(2, lang_code) == "We"
    assert localized_short_weekday(3, lang_code) == "Th"
    assert localized_short_weekday(4, lang_code) == "Fr"
    assert localized_short_weekday(5, lang_code) == "Sa"
    assert localized_short_weekday(6, lang_code) == "Su"


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_datetime():
    assert local_datetime() == datetime.datetime(2024, 1, 1, 2, tzinfo=zoneinfo.ZoneInfo("Europe/Helsinki"))


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_date():
    assert local_date() == datetime.date(2024, 1, 1)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_time():
    assert local_time() == datetime.time(2)
    assert local_time().tzinfo is None


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, 10, 15, tzinfo=datetime.UTC))
def test_date_utils__local_time__midnight():
    assert local_time(0, 0) == datetime.time(0, 0)


def test_date_utils__local_time__given_time():
    assert local_time(10, 30) == datetime.time(10, 30)
    assert local_time(minute=30) == datetime.time(0, 30)
    assert local_time(10, 30).tzinfo is None


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        (datetime.datetime(2026, 1, 1, 21, 59, tzinfo=datetime.UTC), datetime.date(2026, 1, 1)),
        (datetime.datetime(2026, 1, 1, 22, 0, tzinfo=datetime.UTC), datetime.date(2026, 1, 2)),
        (datetime.datetime(2026, 7, 1, 21, 0, tzinfo=datetime.UTC), datetime.date(2026, 7, 2)),
        (datetime.datetime(2026, 1, 2, 0, 30, tzinfo=DEFAULT_TIMEZONE), datetime.date(2026, 1, 2)),
    ],
)
def test_date_utils__local_date_of(value, expected):
    assert local_date_of(value) == expected


def test_date_utils__local_date_of__naive_datetime():
    msg = "Cannot get the local date of a naive datetime."
    with pytest.raises(NaiveDatetimeError, match=exact(msg)):
        local_date_of(datetime.datetime(2026, 1, 1, 12))  # noqa: DTZ001


def test_date_utils__local_combine():
    value = local_combine(datetime.date(2026, 7, 1), datetime.time(10, 0))

    assert value == datetime.datetime(2026, 7, 1, 7, 0, tzinfo=datetime.UTC)


def test_date_utils__local_combine__aware_time():
    msg = "Cannot combine a time that has a timezone."
    with pytest.raises(AwareTimeError, match=exact(msg)):
        local_combine(datetime.date(2026, 7, 1), datetime.time(10, 0, tzinfo=datetime.UTC))


def test_date_utils__local_next_start_of_day():
    value = local_next_start_of_day(datetime.datetime(2026, 1, 1, 22, 30, tzinfo=datetime.UTC))

    assert value == datetime.datetime(2026, 1, 3, 0, 0, tzinfo=DEFAULT_TIMEZONE)


# The clocks move from 03:00 to 04:00 on 2026-03-29, and from 04:00 back to 03:00 on 2026-10-25.
@pytest.mark.parametrize(
    ("value", "days", "expected"),
    [
        (
            datetime.datetime(2026, 3, 28, 10, 0, tzinfo=DEFAULT_TIMEZONE),
            1,
            datetime.datetime(2026, 3, 29, 7, 0, tzinfo=datetime.UTC),
        ),
        (
            datetime.datetime(2026, 10, 24, 10, 0, tzinfo=DEFAULT_TIMEZONE),
            7,
            datetime.datetime(2026, 10, 31, 8, 0, tzinfo=datetime.UTC),
        ),
        (
            datetime.datetime(2026, 3, 28, 3, 30, tzinfo=DEFAULT_TIMEZONE),
            1,
            datetime.datetime(2026, 3, 29, 1, 30, tzinfo=datetime.UTC),
        ),
        (
            datetime.datetime(2026, 10, 24, 22, 0, tzinfo=datetime.UTC),
            1,
            datetime.datetime(2026, 10, 25, 23, 0, tzinfo=datetime.UTC),
        ),
    ],
)
def test_date_utils__local_add_days(value, days, expected):
    result = local_add_days(value, days=days)

    assert result.astimezone(datetime.UTC) == expected
    assert result.tzinfo is DEFAULT_TIMEZONE


def test_date_utils__local_add_days__spring_gap_wall_clock():
    result = local_add_days(datetime.datetime(2026, 3, 28, 3, 30, tzinfo=DEFAULT_TIMEZONE), days=1)

    assert result.date() == datetime.date(2026, 3, 29)
    assert result.time() == datetime.time(4, 30)
    assert local_datetime_exists(result) is True


def test_date_utils__local_add_days__naive_datetime():
    msg = "Cannot add calendar days to a naive datetime."
    with pytest.raises(NaiveDatetimeError, match=exact(msg)):
        local_add_days(datetime.datetime(2026, 1, 1, 12), days=1)  # noqa: DTZ001


# The clocks move from 03:00 to 04:00 on 2026-03-29, and from 04:00 back to 03:00 on 2026-10-25.
@pytest.mark.parametrize(
    ("value", "exists"),
    [
        (datetime.datetime(2026, 3, 29, 2, 30, tzinfo=DEFAULT_TIMEZONE), True),
        (datetime.datetime(2026, 3, 29, 3, 30, tzinfo=DEFAULT_TIMEZONE), False),
        (datetime.datetime(2026, 3, 29, 4, 0, tzinfo=DEFAULT_TIMEZONE), True),
        (datetime.datetime(2026, 10, 25, 3, 30, tzinfo=DEFAULT_TIMEZONE, fold=0), True),
        (datetime.datetime(2026, 10, 25, 3, 30, tzinfo=DEFAULT_TIMEZONE, fold=1), True),
    ],
)
def test_date_utils__local_datetime_exists(value, exists):
    assert local_datetime_exists(value) is exists


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime():
    assert utc_datetime() == datetime.datetime.now(tz=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_date():
    assert utc_date() == datetime.datetime.now(tz=datetime.UTC).date()


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, 10, 15, tzinfo=datetime.UTC))
def test_date_utils__utc_time():
    assert utc_time() == datetime.time(10, 15)
    assert utc_time().tzinfo is None


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime_min():
    assert utc_datetime_min() == datetime.datetime.min.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime_max():
    assert utc_datetime_max() == datetime.datetime.max.replace(tzinfo=datetime.UTC)


def test_date_utils__datetime_difference__across_daylight_saving_time_change():
    start_datetime = datetime.datetime(2026, 10, 25, 1, 0, tzinfo=DEFAULT_TIMEZONE)
    end_datetime = datetime.datetime(2026, 10, 25, 7, 0, tzinfo=DEFAULT_TIMEZONE)

    difference = datetime_difference(start_datetime=start_datetime, end_datetime=end_datetime)

    assert difference == datetime.timedelta(hours=7)


def test_date_utils__add_elapsed_time__across_daylight_saving_time_change():
    value = datetime.datetime(2026, 3, 28, 22, 0, tzinfo=DEFAULT_TIMEZONE)

    result = add_elapsed_time(value, delta=datetime.timedelta(hours=8))

    assert result.astimezone(datetime.UTC) == datetime.datetime(2026, 3, 29, 4, 0, tzinfo=datetime.UTC)
    assert result.date() == datetime.date(2026, 3, 29)
    assert result.time() == datetime.time(7, 0)


def test_date_utils__add_elapsed_time__naive_datetime():
    msg = "Cannot add elapsed time to a naive datetime."
    with pytest.raises(NaiveDatetimeError, match=exact(msg)):
        add_elapsed_time(datetime.datetime(2026, 1, 1, 12), delta=datetime.timedelta(hours=1))  # noqa: DTZ001


@freezegun.freeze_time(datetime.datetime(2026, 3, 29, 0, 30, tzinfo=datetime.UTC))
def test_date_utils__next_hour__across_daylight_saving_time_change():
    result = next_hour(plus_hours=1)

    assert result.astimezone(datetime.UTC) == datetime.datetime(2026, 3, 29, 2, 0, tzinfo=datetime.UTC)
    assert result.date() == datetime.date(2026, 3, 29)
    assert result.time() == datetime.time(5, 0)


@freezegun.freeze_time(datetime.datetime(2026, 3, 28, 10, 30, tzinfo=datetime.UTC))
def test_date_utils__next_hour__plus_days_keeps_wall_clock_time():
    result = next_hour(plus_days=1)

    assert result.date() == datetime.date(2026, 3, 29)
    assert result.time() == datetime.time(13, 0)


@pytest.mark.parametrize(
    ("value", "expected"),
    [
        ("2026-01-01T10:00:00", datetime.datetime(2026, 1, 1, 8, 0, tzinfo=datetime.UTC)),
        ("2026-07-01T10:00:00", datetime.datetime(2026, 7, 1, 7, 0, tzinfo=datetime.UTC)),
        ("2026-01-01T10:00:00+00:00", datetime.datetime(2026, 1, 1, 10, 0, tzinfo=datetime.UTC)),
    ],
)
def test_date_utils__from_iso_format(value, expected):
    result = from_iso_format(value, timezone=DEFAULT_TIMEZONE)

    assert result == expected
    assert result.tzinfo is DEFAULT_TIMEZONE


def test_date_utils__local_from_iso_format__no_offset():
    result = local_from_iso_format("2026-01-01T10:00:00")

    assert result == datetime.datetime(2026, 1, 1, 8, 0, tzinfo=datetime.UTC)


def test_date_utils__parse_naive_datetime():
    result = parse_naive_datetime("20260701-100000", string_format="%Y%m%d-%H%M%S", timezone=DEFAULT_TIMEZONE)

    assert result == datetime.datetime(2026, 7, 1, 7, 0, tzinfo=datetime.UTC)
    assert result.tzinfo is DEFAULT_TIMEZONE


class Params(NamedTuple):
    start_date: datetime.date
    end_date: datetime.date
    start_time: datetime.time
    end_time: datetime.time
    periods: list[tuple[datetime.datetime, datetime.datetime]]
    interval: int = 7


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "single day": Params(
                start_date=datetime.date(2024, 1, 1),
                end_date=datetime.date(2024, 1, 1),
                start_time=datetime.time(12, 0, 0),
                end_time=datetime.time(14, 0, 0),
                periods=[
                    (
                        datetime.datetime(2024, 1, 1, 12, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 1, 14, 0, tzinfo=DEFAULT_TIMEZONE),
                    )
                ],
            ),
            "multiple days": Params(
                start_date=datetime.date(2024, 1, 1),
                end_date=datetime.date(2024, 1, 15),
                start_time=datetime.time(12, 0, 0),
                end_time=datetime.time(14, 0, 0),
                periods=[
                    (
                        datetime.datetime(2024, 1, 1, 12, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 1, 14, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                    (
                        datetime.datetime(2024, 1, 8, 12, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 8, 14, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                    (
                        datetime.datetime(2024, 1, 15, 12, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 15, 14, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                ],
            ),
            "different interval": Params(
                start_date=datetime.date(2024, 1, 1),
                end_date=datetime.date(2024, 1, 12),
                start_time=datetime.time(12, 0, 0),
                end_time=datetime.time(14, 0, 0),
                interval=4,
                periods=[
                    (
                        datetime.datetime(2024, 1, 1, 12, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 1, 14, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                    (
                        datetime.datetime(2024, 1, 5, 12, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 5, 14, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                    (
                        datetime.datetime(2024, 1, 9, 12, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 9, 14, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                ],
            ),
            "end_time is at midnight": Params(
                start_date=datetime.date(2024, 1, 1),
                end_date=datetime.date(2024, 1, 15),
                start_time=datetime.time(21, 0, 0),
                end_time=datetime.time(0, 0, 0),
                periods=[
                    (
                        datetime.datetime(2024, 1, 1, 21, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 2, 0, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                    (
                        datetime.datetime(2024, 1, 8, 21, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 9, 0, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                    (
                        datetime.datetime(2024, 1, 15, 21, 0, tzinfo=DEFAULT_TIMEZONE),
                        datetime.datetime(2024, 1, 16, 0, 0, tzinfo=DEFAULT_TIMEZONE),
                    ),
                ],
            ),
        },
    ),
)
def test_date_utils__get_periods_between(start_date, end_date, start_time, end_time, periods, interval):
    results = get_periods_between(
        start_date,
        end_date,
        start_time,
        end_time,
        tzinfo=DEFAULT_TIMEZONE,
        interval=interval,
    )
    assert list(results) == periods


def test_date_utils__get_periods_between__end_date_before_start_date():
    start_date = datetime.date(2024, 1, 2)
    end_date = datetime.date(2024, 1, 1)
    start_time = datetime.time(12, 0, 0)
    end_time = datetime.time(14, 0, 0)

    msg = "End date cannot be before start date."
    with pytest.raises(ValueError, match=exact(msg)):
        list(get_periods_between(start_date, end_date, start_time, end_time, tzinfo=DEFAULT_TIMEZONE))


def test_date_utils__get_periods_between__end_time_before_start_time():
    start_date = datetime.date(2024, 1, 1)
    end_date = datetime.date(2024, 1, 1)
    start_time = datetime.time(15, 0, 0)
    end_time = datetime.time(14, 0, 0)

    msg = "End time cannot be at or before start time."
    with pytest.raises(ValueError, match=exact(msg)):
        list(get_periods_between(start_date, end_date, start_time, end_time, tzinfo=DEFAULT_TIMEZONE))


def test_date_utils__get_periods_between__end_time_before_start_time__many_days():
    start_date = datetime.date(2024, 1, 1)
    end_date = datetime.date(2024, 1, 8)
    start_time = datetime.time(22, 0, 0)
    end_time = datetime.time(1, 0, 0)

    msg = "End time cannot be at or before start time."
    with pytest.raises(ValueError, match=exact(msg)):
        list(get_periods_between(start_date, end_date, start_time, end_time, tzinfo=DEFAULT_TIMEZONE))


def test_date_utils__get_periods_between__end_time_same_as_start_time():
    start_date = datetime.date(2024, 1, 1)
    end_date = datetime.date(2024, 1, 1)
    start_time = datetime.time(14, 0, 0)
    end_time = datetime.time(14, 0, 0)

    msg = "End time cannot be at or before start time."
    with pytest.raises(ValueError, match=exact(msg)):
        list(get_periods_between(start_date, end_date, start_time, end_time, tzinfo=DEFAULT_TIMEZONE))


def test_date_utils__datetime_range_as_string():
    start_datetime = local_datetime(2026, 10, 24, 20, 0)
    end_datetime = local_datetime(2026, 10, 24, 22, 0)

    result = datetime_range_as_string(start_datetime=start_datetime, end_datetime=end_datetime)

    assert result == "2026-10-24 20:00-22:00"


def test_date_utils__datetime_range_as_string__ends_at_midnight():
    start_datetime = local_datetime(2026, 10, 24, 22, 0)
    end_datetime = local_datetime(2026, 10, 25, 0, 0)

    result = datetime_range_as_string(start_datetime=start_datetime, end_datetime=end_datetime)

    assert result == "2026-10-24 22:00-24:00"


def test_date_utils__datetime_range_as_string__ends_on_another_day():
    start_datetime = local_datetime(2026, 10, 24, 22, 0)
    end_datetime = local_datetime(2026, 10, 25, 2, 0)

    result = datetime_range_as_string(start_datetime=start_datetime, end_datetime=end_datetime)

    assert result == "2026-10-24 22:00-2026-10-25 02:00"


def test_date_utils__datetime_range_as_string__min_and_max():
    result = datetime_range_as_string(start_datetime=utc_datetime_min(), end_datetime=utc_datetime_max())

    assert result == "min-max"
