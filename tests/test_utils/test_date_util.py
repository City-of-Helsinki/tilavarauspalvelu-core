import datetime
import re
import zoneinfo

import freezegun
import pytest

from common.date_utils import (
    combine,
    compare_datetimes,
    compare_times,
    local_date,
    local_datetime,
    local_datetime_max,
    local_datetime_min,
    local_time,
    local_time_max,
    local_time_min,
    utc_date,
    utc_datetime,
    utc_datetime_max,
    utc_datetime_min,
    utc_time,
    utc_time_max,
    utc_time_min,
)
from tilavarauspalvelu.utils.date_util import (
    InvalidWeekdayException,
    localized_short_weekday,
    next_or_current_matching_weekday,
    previous_or_current_matching_weekday,
)


def test_should_return_next_tuesday():
    next_tuesday = next_or_current_matching_weekday(datetime.date(year=2020, month=1, day=1), 1)
    assert next_tuesday == datetime.date(year=2020, month=1, day=7)


def test_next_should_return_current_date_if_weekday_matches():
    next_tuesday = next_or_current_matching_weekday(datetime.date(year=2020, month=1, day=7), 1)
    assert next_tuesday == datetime.date(year=2020, month=1, day=7)


def test_should_return_previous_tuesday():
    next_tuesday = previous_or_current_matching_weekday(datetime.date(year=2020, month=2, day=28), 1)
    assert next_tuesday == datetime.date(year=2020, month=2, day=25)


def test_previous_should_return_current_date_if_weekday_matches():
    next_tuesday = previous_or_current_matching_weekday(datetime.date(year=2020, month=2, day=25), 1)
    assert next_tuesday == datetime.date(year=2020, month=2, day=25)


def test_next_match_should_validate_weekday():
    with pytest.raises(InvalidWeekdayException):
        next_or_current_matching_weekday(datetime.date(year=2020, month=1, day=1), 7)
    with pytest.raises(InvalidWeekdayException):
        next_or_current_matching_weekday(datetime.date(year=2020, month=1, day=1), -1)


def test_previous_match_should_validate_weekday():
    with pytest.raises(InvalidWeekdayException):
        previous_or_current_matching_weekday(datetime.date(year=2020, month=1, day=1), 7)
    with pytest.raises(InvalidWeekdayException):
        previous_or_current_matching_weekday(datetime.date(year=2020, month=1, day=1), -1)


def test_localized_short_weekday_fi():
    lang_code = "fi"
    assert localized_short_weekday(0, lang_code) == "Ma"
    assert localized_short_weekday(1, lang_code) == "Ti"
    assert localized_short_weekday(2, lang_code) == "Ke"
    assert localized_short_weekday(3, lang_code) == "To"
    assert localized_short_weekday(4, lang_code) == "Pe"
    assert localized_short_weekday(5, lang_code) == "La"
    assert localized_short_weekday(6, lang_code) == "Su"


def test_localized_short_weekday_sv():
    lang_code = "sv"
    assert localized_short_weekday(0, lang_code) == "Må"
    assert localized_short_weekday(1, lang_code) == "Ti"
    assert localized_short_weekday(2, lang_code) == "On"
    assert localized_short_weekday(3, lang_code) == "To"
    assert localized_short_weekday(4, lang_code) == "Fr"
    assert localized_short_weekday(5, lang_code) == "Lö"
    assert localized_short_weekday(6, lang_code) == "Sö"


def test_localized_short_weekday_en():
    lang_code = "en"
    assert localized_short_weekday(0, lang_code) == "Mo"
    assert localized_short_weekday(1, lang_code) == "Tu"
    assert localized_short_weekday(2, lang_code) == "We"
    assert localized_short_weekday(3, lang_code) == "Th"
    assert localized_short_weekday(4, lang_code) == "Fr"
    assert localized_short_weekday(5, lang_code) == "Sa"
    assert localized_short_weekday(6, lang_code) == "Su"


# The following tests demonstrate some bugs between `datetime.timezone` and `zoneinfo.ZoneInfo` when
# with comparing timezone-aware and timezone-naive datetimes/times. The date utils are needed because
# of these bugs, so check that they still hold true. If they start failing, the helpers might
# have become unnecessary.


def test_compare_datetimes():
    dt_zi = datetime.datetime(2024, 1, 1, tzinfo=zoneinfo.ZoneInfo("Europe/Helsinki"))
    dt_utc = datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC)
    dt_naive = datetime.datetime(2024, 1, 1)

    # Comparing equals and not equals with datetime naive object
    # does not raise an error, but comparing lt/gt/lte/gte does.
    assert dt_zi != dt_naive
    assert dt_utc != dt_naive
    assert not (dt_zi == dt_naive)  # noqa: SIM201
    assert not (dt_utc == dt_naive)  # noqa: SIM201

    msg = "can't compare offset-naive and offset-aware datetimes"
    with pytest.raises(TypeError, match=re.escape(msg)):
        assert dt_zi > dt_naive

    with pytest.raises(TypeError, match=re.escape(msg)):
        assert dt_utc > dt_naive

    # This comparison object will complain about mixing timezone-aware and timezone-naive datetimes.
    msg = "Input 1 must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
    with pytest.raises(ValueError, match=re.escape(msg)):
        assert compare_datetimes(dt_naive, dt_utc)

    msg = "Input 2 must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
    with pytest.raises(ValueError, match=re.escape(msg)):
        assert compare_datetimes(dt_zi, dt_naive)

    msg = "Input 2 must be a `datetime.datetime` object."
    with pytest.raises(TypeError, match=re.escape(msg)):
        assert compare_datetimes(dt_utc, None)

    # Check for safeguards against comparing the comparison object directly.
    msg = "Cannot compare 'compare_datetimes' object directly. Did you forget to call a comparison method?"
    with pytest.raises(RuntimeError, match=re.escape(msg)):
        assert compare_datetimes(dt_utc, dt_zi)


def test_compare_times():
    t_zi = datetime.time(tzinfo=zoneinfo.ZoneInfo("Europe/Helsinki"))
    t_utc = datetime.time(tzinfo=datetime.UTC)
    t_naive = datetime.time()

    # Comparing equals and not equals with datetime naive object
    # does not raise an error, but comparing lt/gt/lte/gte does.
    assert t_zi == t_naive
    assert t_utc != t_naive
    assert not (t_zi != t_naive)  # noqa: SIM202
    assert not (t_utc == t_naive)  # noqa: SIM201

    # Comparing lt/gt/lte/gte with datetime naive object and zoneinfo.ZoneInfo object
    # does not raise an error, but comparing lt/gt/lte/gte with datetime naive object
    # and datetime.UTC does.
    assert t_zi >= t_naive
    msg = "can't compare offset-naive and offset-aware times"
    with pytest.raises(TypeError, match=re.escape(msg)):
        assert t_utc >= t_naive

    # This comparison object will complain about mixing timezone-aware and timezone-naive datetimes.
    msg = "Input 1 must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
    with pytest.raises(ValueError, match=re.escape(msg)):
        assert compare_times(t_naive, t_utc)

    msg = "Input 2 must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
    with pytest.raises(ValueError, match=re.escape(msg)):
        assert compare_times(t_utc, t_naive)

    msg = (
        "Input 1 cannot be a timezone-aware time using `zoneinfo.ZoneInfo` objects, "
        "since there is no way to know if the time is in daylight savings time or not."
    )
    with pytest.raises(TypeError, match=re.escape(msg)):
        assert compare_times(t_zi, t_utc)

    msg = "Input 2 must be a `datetime.datetime` or `datetime.time` object."
    with pytest.raises(TypeError, match=re.escape(msg)):
        assert compare_times(t_utc, None)

    # Check that datetime objects can also be used
    msg = "Input 2 must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
    with pytest.raises(ValueError, match=re.escape(msg)):
        assert compare_times(t_utc, datetime.datetime.now())

    # Check for safeguards against comparing the comparison object directly.
    msg = "Cannot compare 'compare_times' object directly. Did you forget to call a comparison method?"
    with pytest.raises(RuntimeError, match=re.escape(msg)):
        assert compare_times(t_utc, t_utc)


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
    dt = combine(utc_date(), utc_time())
    assert dt == datetime.datetime.now(tz=datetime.UTC)

    msg = "Must give `tzinfo` or time must be timezone-aware using `zoneinfo.ZoneInfo` objects or `datetime.UTC`."
    with pytest.raises(ValueError, match=msg):
        combine(utc_date(), datetime.time.min)

    dt = combine(utc_date(), datetime.time.min, tzinfo=datetime.UTC)
    assert dt == datetime.datetime.combine(utc_date(), datetime.time.min, tzinfo=datetime.UTC)
