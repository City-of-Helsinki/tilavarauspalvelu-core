import datetime
import zoneinfo

import freezegun
import pytest

from common.date_utils import (
    combine,
    datetimes_equal,
    local_date,
    local_datetime,
    local_datetime_max,
    local_datetime_min,
    local_time,
    local_time_max,
    local_time_min,
    local_timezone,
    times_equal,
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
TIMEZONE = zoneinfo.ZoneInfo("Europe/Helsinki")


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_timezone(settings):
    tz = local_timezone()
    assert tz.utcoffset(None) == datetime.timedelta(seconds=7200)
    assert tz.tzname(None) == settings.TIME_ZONE

    # These should be the same, but aren't, so check that this is still the case.
    assert tz.utcoffset(None) != TIMEZONE.utcoffset(None)
    assert tz.tzname(None) != TIMEZONE.tzname(None)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_datetime():
    tz = local_timezone()
    dt_1 = local_datetime()
    dt_2 = datetime.datetime(2024, 1, 1, hour=2, tzinfo=tz)
    dt_3 = datetime.datetime(2024, 1, 1, hour=2, tzinfo=TIMEZONE)
    dt_4 = datetime.datetime(2024, 1, 1, hour=2)

    msg = "can't compare offset-naive and offset-aware datetimes"

    assert dt_1 == dt_2
    assert dt_1 >= dt_2
    assert dt_1 <= dt_2

    assert dt_1 == dt_3
    assert dt_1 >= dt_3
    assert dt_1 <= dt_3

    assert dt_1 != dt_4
    with pytest.raises(TypeError, match=msg):
        assert dt_1 >= dt_4
    with pytest.raises(TypeError, match=msg):
        assert dt_1 <= dt_4

    assert dt_3 != dt_4
    with pytest.raises(TypeError, match=msg):
        assert dt_3 >= dt_4
    with pytest.raises(TypeError, match=msg):
        assert dt_3 <= dt_4


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_date():
    assert local_date() == datetime.date(2024, 1, 1)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_time():
    tz = local_timezone()

    t_1 = local_time()
    t_2 = datetime.time(hour=2, tzinfo=tz)
    t_3 = datetime.time(hour=2, tzinfo=TIMEZONE)
    t_4 = datetime.time(hour=2)

    msg = "can't compare offset-naive and offset-aware times"

    assert t_1 == t_2
    assert t_1 >= t_2
    assert t_1 <= t_2

    assert t_1 != t_3  # Should be equal, but isn't, so check that this is still the case.
    with pytest.raises(TypeError, match=msg):  # Should not raise, but does, so check that this is still the case.
        assert t_1 >= t_3
    with pytest.raises(TypeError, match=msg):  # Should not raise, but does, so check that this is still the case.
        assert t_1 <= t_3

    assert t_1 != t_4
    with pytest.raises(TypeError, match=msg):
        assert t_1 >= t_4
    with pytest.raises(TypeError, match=msg):
        assert t_1 <= t_4

    assert t_3 == t_4  # This should not be equal, but is, so check that this is still the case.
    assert t_3 >= t_4  # This should raise a TypeError, but doesn't, so check that this is still the case.
    assert t_3 <= t_4  # This should raise a TypeError, but doesn't, so check that this is still the case.


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_datetime_min():
    tz = local_timezone()
    dt_min_1 = local_datetime_min()
    dt_min_2 = datetime.datetime.min.replace(tzinfo=tz)
    dt_min_3 = datetime.datetime.min.replace(tzinfo=TIMEZONE)
    dt_min_4 = datetime.datetime.min

    msg = "can't compare offset-naive and offset-aware datetimes"

    assert dt_min_1 == dt_min_2
    assert dt_min_1 >= dt_min_2
    assert dt_min_1 <= dt_min_2

    assert dt_min_1 != dt_min_3  # Should be equal, but isn't, so check that this is still the case.
    assert not (dt_min_1 >= dt_min_3)  # Should be true, but isn't, so check that this is still the case.
    assert dt_min_1 <= dt_min_3

    assert dt_min_1 != dt_min_4
    with pytest.raises(TypeError, match=msg):
        assert dt_min_1 >= dt_min_4
    with pytest.raises(TypeError, match=msg):
        assert dt_min_1 <= dt_min_4

    assert dt_min_3 != dt_min_4
    with pytest.raises(TypeError, match=msg):
        assert dt_min_3 >= dt_min_4
    with pytest.raises(TypeError, match=msg):
        assert dt_min_3 <= dt_min_4


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_datetime_max():
    tz = local_timezone()
    dt_max_1 = local_datetime_max()
    dt_max_2 = datetime.datetime.max.replace(tzinfo=tz)
    dt_max_3 = datetime.datetime.max.replace(tzinfo=TIMEZONE)
    dt_max_4 = datetime.datetime.max

    msg = "can't compare offset-naive and offset-aware datetimes"

    assert dt_max_1 == dt_max_2
    assert dt_max_1 >= dt_max_2
    assert dt_max_1 <= dt_max_2

    assert dt_max_1 == dt_max_3
    assert dt_max_1 >= dt_max_3
    assert dt_max_1 <= dt_max_3

    assert dt_max_1 != dt_max_4
    with pytest.raises(TypeError, match=msg):
        assert dt_max_1 >= dt_max_4
    with pytest.raises(TypeError, match=msg):
        assert dt_max_1 <= dt_max_4

    assert dt_max_3 != dt_max_4
    with pytest.raises(TypeError, match=msg):
        assert dt_max_3 >= dt_max_4
    with pytest.raises(TypeError, match=msg):
        assert dt_max_3 <= dt_max_4


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_time_min():
    tz = local_timezone()
    t_min_1 = local_time_min()
    t_min_2 = datetime.time.min.replace(tzinfo=tz)
    t_min_3 = datetime.time.min.replace(tzinfo=TIMEZONE)
    t_min_4 = datetime.time.min

    msg = "can't compare offset-naive and offset-aware times"

    assert t_min_1 == t_min_2
    assert t_min_1 >= t_min_2
    assert t_min_1 <= t_min_2

    assert t_min_1 != t_min_3  # Should be equal, but isn't, so check that this is still the case.
    with pytest.raises(TypeError, match=msg):  # Should not raise, but does, so check that this is still the case.
        assert t_min_1 >= t_min_3
    with pytest.raises(TypeError, match=msg):  # Should not raise, but does, so check that this is still the case.
        assert t_min_1 <= t_min_3

    assert t_min_1 != t_min_4
    with pytest.raises(TypeError, match=msg):
        assert t_min_1 >= t_min_4
    with pytest.raises(TypeError, match=msg):
        assert t_min_1 <= t_min_4

    assert t_min_3 == t_min_4  # This should not be equal, but is, so check that this is still the case.
    assert t_min_3 >= t_min_4  # This should raise a TypeError, but doesn't, so check that this is still the case.
    assert t_min_3 <= t_min_4  # This should raise a TypeError, but doesn't, so check that this is still the case.


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__local_time_max():
    tz = local_timezone()
    t_max_1 = local_time_max()
    t_max_2 = datetime.time.max.replace(tzinfo=tz)
    t_max_3 = datetime.time.max.replace(tzinfo=TIMEZONE)
    t_max_4 = datetime.time.max

    msg = "can't compare offset-naive and offset-aware times"

    assert t_max_1 == t_max_2
    assert t_max_1 >= t_max_2
    assert t_max_1 <= t_max_2

    assert t_max_1 != t_max_3  # Should be equal, but isn't, so check that this is still the case.
    with pytest.raises(TypeError, match=msg):  # Should not raise, but does, so check that this is still the case.
        assert t_max_1 >= t_max_3
    with pytest.raises(TypeError, match=msg):  # Should not raise, but does, so check that this is still the case.
        assert t_max_1 <= t_max_3

    assert t_max_1 != t_max_4
    with pytest.raises(TypeError, match=msg):
        assert t_max_1 >= t_max_4
    with pytest.raises(TypeError, match=msg):
        assert t_max_1 <= t_max_4

    assert t_max_3 == t_max_4  # This should not be equal, but is, so check that this is still the case.
    assert t_max_3 >= t_max_4  # This should raise a TypeError, but doesn't, so check that this is still the case.
    assert t_max_3 <= t_max_4  # This should raise a TypeError, but doesn't, so check that this is still the case.


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime():
    assert utc_datetime() == datetime.datetime.now(tz=datetime.UTC)
    assert utc_datetime() >= datetime.datetime.now(tz=datetime.UTC)
    assert utc_datetime() <= datetime.datetime.now(tz=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_date():
    assert utc_date() == datetime.datetime.now(tz=datetime.UTC).date()


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_time():
    assert utc_time() == datetime.datetime.now(tz=datetime.UTC).timetz()
    assert utc_time() >= datetime.datetime.now(tz=datetime.UTC).timetz()
    assert utc_time() <= datetime.datetime.now(tz=datetime.UTC).timetz()

    msg = "can't compare offset-naive and offset-aware times"

    assert utc_time() != datetime.datetime.now(tz=datetime.UTC).time()
    with pytest.raises(TypeError, match=msg):
        assert utc_time() >= datetime.datetime.now(tz=datetime.UTC).time()
    with pytest.raises(TypeError, match=msg):
        assert utc_time() <= datetime.datetime.now(tz=datetime.UTC).time()


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime_min():
    assert utc_datetime_min() == datetime.datetime.min.replace(tzinfo=datetime.UTC)
    assert utc_datetime_min() >= datetime.datetime.min.replace(tzinfo=datetime.UTC)
    assert utc_datetime_min() <= datetime.datetime.min.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_datetime_max():
    assert utc_datetime_max() == datetime.datetime.max.replace(tzinfo=datetime.UTC)
    assert utc_datetime_max() >= datetime.datetime.max.replace(tzinfo=datetime.UTC)
    assert utc_datetime_max() <= datetime.datetime.max.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_time_min():
    assert utc_time_min() == datetime.time.min.replace(tzinfo=datetime.UTC)
    assert utc_time_min() >= datetime.time.min.replace(tzinfo=datetime.UTC)
    assert utc_time_min() <= datetime.time.min.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__utc_time_max():
    assert utc_time_max() == datetime.time.max.replace(tzinfo=datetime.UTC)
    assert utc_time_max() >= datetime.time.max.replace(tzinfo=datetime.UTC)
    assert utc_time_max() <= datetime.time.max.replace(tzinfo=datetime.UTC)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__combine():
    dt = combine(utc_date(), utc_time())
    assert dt == datetime.datetime.now(tz=datetime.UTC)

    msg = "Time must be timezone-aware using `datetime.timezone` objects."
    with pytest.raises(ValueError, match=msg):
        combine(utc_date(), datetime.time.min)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__datetimes_equal():
    dt_zi = datetime.datetime(2021, 1, 1, tzinfo=TIMEZONE)
    dt_tz = datetime.datetime(2021, 1, 1, tzinfo=datetime.UTC)
    dt_naive = datetime.datetime(2021, 1, 1)

    msg = "can't compare offset-naive and offset-aware datetimes"

    with pytest.raises(TypeError, match=msg):
        assert dt_zi >= dt_naive
    with pytest.raises(TypeError, match=msg):
        assert dt_zi <= dt_naive
    with pytest.raises(TypeError, match=msg):
        assert dt_tz >= dt_naive
    with pytest.raises(TypeError, match=msg):
        assert dt_tz <= dt_naive

    assert dt_zi != dt_naive  # Comparing timezone aware and naive times, so this should raise, but doesn't.
    assert dt_tz != dt_naive  # Comparing timezone aware and naive times, so this should raise, but doesn't.

    msg = "First datetime must be timezone-aware using `datetime.timezone` objects."
    with pytest.raises(ValueError, match=msg):
        datetimes_equal(dt_naive, dt_tz)

    datetimes_equal(dt_zi, dt_tz)

    msg = "Second datetime must be timezone-aware using `datetime.timezone` objects."
    with pytest.raises(ValueError, match=msg):
        datetimes_equal(dt_tz, dt_naive)

    datetimes_equal(dt_tz, dt_zi)


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, tzinfo=datetime.UTC))
def test_date_utils__times_equal():
    t_zi = datetime.time(tzinfo=TIMEZONE)
    t_tz = datetime.time(tzinfo=datetime.UTC)
    t_naive = datetime.time()

    msg = "can't compare offset-naive and offset-aware times"

    assert t_zi >= t_naive  # Comparing timezone aware and naive times, so this should raise, but doesn't.
    assert t_zi <= t_naive  # Comparing timezone aware and naive times, so this should raise, but doesn't.

    with pytest.raises(TypeError, match=msg):
        assert t_tz >= t_naive
    with pytest.raises(TypeError, match=msg):
        assert t_tz <= t_naive

    assert t_zi == t_naive  # Comparing timezone aware and naive times, so this should raise, but doesn't.
    assert t_tz != t_naive  # Comparing timezone aware and naive times, so this should raise, but doesn't.

    msg = "First time must be timezone-aware using `datetime.timezone` objects."
    with pytest.raises(ValueError, match=msg):
        times_equal(t_naive, t_tz)
    with pytest.raises(ValueError, match=msg):
        times_equal(t_zi, t_tz)  # Should not raise, but does, so check that this is still the case.

    msg = "Second time must be timezone-aware using `datetime.timezone` objects."
    with pytest.raises(ValueError, match=msg):
        times_equal(t_tz, t_naive)
    with pytest.raises(ValueError, match=msg):
        times_equal(t_tz, t_zi)  # Should not raise, but does, so check that this is still the case.
