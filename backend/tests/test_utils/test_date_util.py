from __future__ import annotations

import datetime
import re
import zoneinfo
from typing import TYPE_CHECKING, NamedTuple

import freezegun
import pytest
from graphene_django_extensions.testing import parametrize_helper

from utils.date_utils import (
    DEFAULT_TIMEZONE,
    combine,
    get_periods_between,
    local_date,
    local_datetime,
    local_datetime_max,
    local_datetime_min,
    local_time,
    local_time_max,
    local_time_min,
    localized_short_weekday,
    utc_date,
    utc_datetime,
    utc_datetime_max,
    utc_datetime_min,
    utc_time,
    utc_time_max,
    utc_time_min,
)

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
    assert local_time() == datetime.time(2, tzinfo=zoneinfo.ZoneInfo("Europe/Helsinki"))


def test_date_utils__local_datetime_min():
    assert local_datetime_min() == datetime.datetime.min.replace(tzinfo=zoneinfo.ZoneInfo("Europe/Helsinki"))


def test_date_utils__local_datetime_max():
    assert local_datetime_max() == datetime.datetime.max.replace(tzinfo=zoneinfo.ZoneInfo("Europe/Helsinki"))


def test_date_utils__local_time_min():
    assert local_time_min() == datetime.time.min.replace(tzinfo=zoneinfo.ZoneInfo("Europe/Helsinki"))


def test_date_utils__local_time_max():
    assert local_time_max() == datetime.time.max.replace(tzinfo=zoneinfo.ZoneInfo("Europe/Helsinki"))


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime():
    assert utc_datetime() == datetime.datetime.now(tz=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_date():
    assert utc_date() == datetime.datetime.now(tz=datetime.UTC).date()


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_time():
    assert utc_time() == datetime.datetime.now(tz=datetime.UTC).timetz()


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime_min():
    assert utc_datetime_min() == datetime.datetime.min.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime_max():
    assert utc_datetime_max() == datetime.datetime.max.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_time_min():
    assert utc_time_min() == datetime.time.min.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_time_max():
    assert utc_time_max() == datetime.time.max.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__combine():
    date = datetime.date(2022, 1, 1)
    time_naive = datetime.time(8, 0)
    time_aware = datetime.time(8, 0, tzinfo=datetime.UTC)

    dt = combine(date, time_naive, astimezone=datetime.UTC)
    assert dt == datetime.datetime(2022, 1, 1, 8, 0, tzinfo=datetime.UTC)

    dt = combine(date, time_naive, astimezone=DEFAULT_TIMEZONE)
    assert dt == datetime.datetime(2022, 1, 1, 10, 0, tzinfo=DEFAULT_TIMEZONE)

    msg = "Time must not be timezone-aware."
    with pytest.raises(ValueError, match=re.escape(msg)):
        combine(date, time_aware, astimezone=datetime.UTC)


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
    with pytest.raises(ValueError, match=re.escape(msg)):
        list(get_periods_between(start_date, end_date, start_time, end_time, tzinfo=DEFAULT_TIMEZONE))


def test_date_utils__get_periods_between__end_time_before_start_time():
    start_date = datetime.date(2024, 1, 1)
    end_date = datetime.date(2024, 1, 1)
    start_time = datetime.time(15, 0, 0)
    end_time = datetime.time(14, 0, 0)

    msg = "End time cannot be at or before start time if on the same day."
    with pytest.raises(ValueError, match=re.escape(msg)):
        list(get_periods_between(start_date, end_date, start_time, end_time, tzinfo=DEFAULT_TIMEZONE))


def test_date_utils__get_periods_between__end_time_sames_as_start_time():
    start_date = datetime.date(2024, 1, 1)
    end_date = datetime.date(2024, 1, 1)
    start_time = datetime.time(14, 0, 0)
    end_time = datetime.time(14, 0, 0)

    msg = "End time cannot be at or before start time if on the same day."
    with pytest.raises(ValueError, match=re.escape(msg)):
        list(get_periods_between(start_date, end_date, start_time, end_time, tzinfo=DEFAULT_TIMEZONE))
