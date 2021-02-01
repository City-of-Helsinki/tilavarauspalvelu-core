import datetime

from pytest import raises

from tilavarauspalvelu.utils.date_util import (
    InvalidWeekdayException,
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
