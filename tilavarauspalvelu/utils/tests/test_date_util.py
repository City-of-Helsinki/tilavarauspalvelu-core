import datetime

from pytest import raises

from tilavarauspalvelu.utils.date_util import (
    InvalidWeekdayException,
    localized_short_weekday,
    next_or_current_matching_weekday,
    previous_or_current_matching_weekday,
)


def test_should_return_next_tuesday():
    next_tuesday = next_or_current_matching_weekday(
        datetime.date(year=2020, month=1, day=1), 1
    )
    assert next_tuesday == datetime.date(year=2020, month=1, day=7)


def test_next_should_return_current_date_if_weekday_matches():
    next_tuesday = next_or_current_matching_weekday(
        datetime.date(year=2020, month=1, day=7), 1
    )
    assert next_tuesday == datetime.date(year=2020, month=1, day=7)


def test_should_return_previous_tuesday():
    next_tuesday = previous_or_current_matching_weekday(
        datetime.date(year=2020, month=2, day=28), 1
    )
    assert next_tuesday == datetime.date(year=2020, month=2, day=25)


def test_previous_should_return_current_date_if_weekday_matches():
    next_tuesday = previous_or_current_matching_weekday(
        datetime.date(year=2020, month=2, day=25), 1
    )
    assert next_tuesday == datetime.date(year=2020, month=2, day=25)


def test_next_match_should_validate_weekday():
    with raises(InvalidWeekdayException):
        next_or_current_matching_weekday(datetime.date(year=2020, month=1, day=1), 7)
    with raises(InvalidWeekdayException):
        next_or_current_matching_weekday(datetime.date(year=2020, month=1, day=1), -1)


def test_previous_match_should_validate_weekday():
    with raises(InvalidWeekdayException):
        previous_or_current_matching_weekday(
            datetime.date(year=2020, month=1, day=1), 7
        )
    with raises(InvalidWeekdayException):
        previous_or_current_matching_weekday(
            datetime.date(year=2020, month=1, day=1), -1
        )


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
