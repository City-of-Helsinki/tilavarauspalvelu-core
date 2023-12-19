from dataclasses import asdict, dataclass
from datetime import UTC, date, datetime, timedelta
from functools import partial
from typing import NamedTuple

import freezegun
import pytest
from django.utils.timezone import get_default_timezone

from applications.choices import ApplicationRoundStatusChoice
from reservation_units.models import ReservationUnit
from tests.factories import (
    ApplicationRoundFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationUnitFactory,
)
from tests.helpers import parametrize_helper

from .helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

reservation_units_reservable_query = partial(reservation_units_query, fields="isClosed firstReservableDatetime")


DEFAULT_TIMEZONE = get_default_timezone()


def _datetime(year=2023, month=5, day=1, hour=0, minute=0) -> datetime:
    # Convert to UTC to match timezone returned by GQL endpoint
    return datetime(year, month, day, hour, minute, tzinfo=DEFAULT_TIMEZONE).astimezone(UTC)


NOW = _datetime(year=2023, month=5, day=10, hour=13, minute=0)


@pytest.fixture()
def reservation_unit() -> ReservationUnit:
    origin_hauki_resource = OriginHaukiResourceFactory(
        id="999",
        opening_hours_hash="test_hash",
        latest_fetched_date=date(2023, 12, 31),
    )
    reservation_unit = ReservationUnitFactory(
        origin_hauki_resource=origin_hauki_resource,
        reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
        reservation_begins=None,
        reservation_ends=None,
        reservations_min_days_before=None,
        reservations_max_days_before=None,
        min_reservation_duration=None,
        max_reservation_duration=None,
    )
    return reservation_unit


@dataclass
class ReservableFilters:
    reservable_date_start: str | None = None
    reservable_date_end: str | None = None
    reservable_time_start: str | None = None
    reservable_time_end: str | None = None
    reservable_minimum_duration_minutes: int | None = None
    show_only_reservable: bool | None = None


@dataclass
class ReservationUnitOverrides:
    reservation_start_interval: str | None = None
    reservation_begins: datetime | None = None
    reservation_ends: datetime | None = None
    publish_ends: datetime | None = None
    reservations_min_days_before: int | None = None
    reservations_max_days_before: int | None = None
    min_reservation_duration: timedelta | None = None
    max_reservation_duration: timedelta | None = None


@dataclass
class ApplicationStatusParams:
    status: ApplicationRoundStatusChoice
    sent_date: datetime | None = None
    handled_date: datetime | None = None
    reservation_period_begin: date | None = None
    reservation_period_end: date | None = None
    # application_period_begin: datetime | None = None
    # application_period_end: datetime | None = None
    reservation_units: list[ReservationUnit] | None = None


@dataclass
class ReservableNode:
    is_closed: bool
    first_reservable_datetime: str | None

    def __init__(self, is_closed: bool, first_reservable_datetime: datetime | None = None):
        self.is_closed = is_closed
        self.first_reservable_datetime = first_reservable_datetime.isoformat() if first_reservable_datetime else None


class ReservableParams(NamedTuple):
    filters: ReservableFilters | None = None
    result: ReservableNode | str | None = None


class RU_ReservableParams(NamedTuple):
    reservation_unit_settings: ReservationUnitOverrides | None = None
    filters: ReservableFilters | None = None
    result: ReservableNode | str | None = None


class AR_ReservableParams(NamedTuple):
    application_round_params: ApplicationStatusParams
    filters: ReservableFilters | None = None
    result: ReservableNode | str | None = None


def apply_reservation_unit_override_settings(
    reservation_unit: ReservationUnit,
    settings: ReservationUnitOverrides,
):
    for key, value in asdict(settings).items():
        if value is not None:
            setattr(reservation_unit, key, value)
    reservation_unit.save()


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Date Start is in the past": ReservableParams(
                filters=ReservableFilters(reservable_date_start="2023-05-09"),
                result="'reservable_date_start' must be not be in the past.",
            ),
            "Date End is in the past": ReservableParams(
                filters=ReservableFilters(reservable_date_end="2023-05-09"),
                result="'reservable_date_end' must be not be in the past.",
            ),
            "Date End is before Date Start": ReservableParams(
                filters=ReservableFilters(reservable_date_start="2023-05-20", reservable_date_end="2023-05-19"),
                result="'reservable_date_start' must be before 'reservable_date_end'.",
            ),
            "Time Start and End filters exact start time": ReservableParams(
                filters=ReservableFilters(reservable_time_start="15:00:00", reservable_time_end="15:00:00"),
                result="'reservable_time_start' must be before 'reservable_time_end'.",
            ),
            "Minimum duration minutes is zero": ReservableParams(
                filters=ReservableFilters(reservable_minimum_duration_minutes=0),
                result="'minimum_duration_minutes' can not be less than '15'.",
            ),
            "Minimum duration minutes less than 15": ReservableParams(
                filters=ReservableFilters(reservable_minimum_duration_minutes=14),
                result="'minimum_duration_minutes' can not be less than '15'.",
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__invalid_filter_values(graphql, reservation_unit, filters, result):
    """Invalid filter values should return an error"""
    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is True, response
    assert result in response.error_message() == result


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__no_results_time_spans_dont_exist(graphql, reservation_unit):
    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert response.node(0) == {"isClosed": True, "firstReservableDatetime": None}


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "No Results | Date Start is after the last reservable time": ReservableParams(
                filters=ReservableFilters(
                    reservable_date_start="2023-05-21",
                ),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Date End is before next reservable time": ReservableParams(
                filters=ReservableFilters(
                    reservable_date_end="2023-05-19",
                ),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Time Start is when time span ends": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="19:00:00",
                ),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Time Start is after all reservable times have ended": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="19:01:00",
                ),
                result=ReservableNode(is_closed=True),
            ),
            "Basic | Time End is when time span starts": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_end="15:00:00",
                ),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Time End is before any reservable time begins": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_end="14:59:00",
                ),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Minimum Duration Minutes is longer than reservable time span": ReservableParams(
                filters=ReservableFilters(
                    reservable_minimum_duration_minutes=241,  # 4 hours + 1 minute
                ),
                result=ReservableNode(is_closed=False),
            ),
            "No Results | Time Start and Minimum duration cause reservable time to be too short": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="18:01:00",
                    reservable_minimum_duration_minutes=60,
                ),
                result=ReservableNode(is_closed=False),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__too_strict_no_results(graphql, reservation_unit, filters, result):
    """Filters that are too strict and cause no results to be returned"""
    # 2023-05-20 15:00-19:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(month=5, day=20, hour=15),
        end_datetime=_datetime(month=5, day=20, hour=19),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": result.is_closed,
        "firstReservableDatetime": None,
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            # Basic filter values
            "Basic | No filters": ReservableParams(
                filters=ReservableFilters(),
            ),
            "Basic | Only reservable_date_start": ReservableParams(
                filters=ReservableFilters(reservable_date_start="2023-05-10")  # First reservable time span = NOW
            ),
            "Basic | Only reservable_date_end": ReservableParams(
                filters=ReservableFilters(reservable_date_end="2023-05-30"),
            ),
            "Basic | Only reservable_time_start": ReservableParams(
                filters=ReservableFilters(reservable_time_start="13:00:00"),
            ),
            "Basic | Only reservable_time_end": ReservableParams(
                filters=ReservableFilters(reservable_time_end="14:00:00"),
            ),
            "Basic | Only reservable_minimum_duration_minutes": ReservableParams(
                filters=ReservableFilters(reservable_minimum_duration_minutes=30),
            ),
            "Basic | Only show_only_reservable True": ReservableParams(
                filters=ReservableFilters(show_only_reservable=True),
            ),
            "Basic | Only show_only_reservable False": ReservableParams(
                filters=ReservableFilters(show_only_reservable=False),
            ),
            "Basic | All filters": ReservableParams(
                filters=ReservableFilters(
                    reservable_date_start="2023-05-10",
                    reservable_date_end="2023-12-31",
                    reservable_time_start="00:00:00",
                    reservable_time_end="23:59:59",
                    reservable_minimum_duration_minutes=30,
                    show_only_reservable=False,
                ),
            ),
            # Edge cases
            "Basic | reservable_minimum_duration_minutes same length as time span": ReservableParams(
                filters=ReservableFilters(reservable_minimum_duration_minutes=60),
            ),
            "Basic | Start and End Date filters same as time span": ReservableParams(
                filters=ReservableFilters(
                    reservable_date_start="2023-05-11",
                    reservable_date_end="2023-05-11",
                ),
            ),
            "Basic | Start and End Time filters same as time span": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="13:00",
                    reservable_time_end="14:00",
                ),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__basic_values(graphql, reservation_unit, filters, result):
    """Filters with 'basic' values, which should always return the first reservable time span"""
    # Reservable Time Span is in the past, should never be returned
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=1, hour=13),
        end_datetime=_datetime(day=1, hour=14),
    )
    # Next available Reservable Time Span
    # 2023-05-11 13:00-14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=11, hour=13),
        end_datetime=_datetime(day=11, hour=14),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(day=11, hour=13).isoformat(),
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            # Simple
            "Simple | Date Start in the future": ReservableParams(
                filters=ReservableFilters(
                    reservable_date_start="2023-05-12",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=7)),
            ),
            "Simple | Time End filter is early in the morning": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_end="09:00:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=7)),
            ),
            "Simple | Minimum Duration Minutes matches time span duration exactly": ReservableParams(
                filters=ReservableFilters(
                    reservable_minimum_duration_minutes=240,  # 4 hours
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Simple | Time Start is after Time Span start time, return valid next interval": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="13:01:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=11, hour=13, minute=15)),
            ),
            "Simple | Time Start filter is at next interval, since it's valid it should be returned": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="13:15:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=11, hour=13, minute=15)),
            ),
            "Simple | Time Start and End filters together match time span exactly": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="17:00:00",
                    reservable_time_end="21:00:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Simple | Time Start and End only partially contain the ReservableTimeSpan from start": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="17:01:00",
                    reservable_time_end="21:00:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17, minute=15)),
            ),
            "Simple | Time Start and End only partially contain the ReservableTimeSpan from end": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="17:00:00",
                    reservable_time_end="20:59:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Simple | Time Start late at night, reservation ends at midnight": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="22:00:00",
                    reservable_minimum_duration_minutes=120,  # 2 hours
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=25, hour=22)),
            ),
            "Simple | Time Start is at midnight on time spans second day": ReservableParams(
                filters=ReservableFilters(
                    reservable_date_start="2023-05-26",
                    reservable_time_start="00:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=26, hour=0)),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__simple(graphql, reservation_unit, filters, result):
    """Filters with 'simple' values, which are a bit more advanced than the previous test"""
    # Next available reservable time span
    # 2023-05-11 13:00-14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=11, hour=13),
        end_datetime=_datetime(day=11, hour=14),
    )
    # Early in the morning
    # 2023-05-15 07:00-09:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=15, hour=7),
        end_datetime=_datetime(day=15, hour=9),
    )
    # In the evening
    # 2023-05-20 15:00-19:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=20, hour=17),
        end_datetime=_datetime(day=20, hour=21),
    )
    # Very late in the evening, ends after midnight next day
    # 2023-05-25 22:00 - 2023-05-26 02:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=25, hour=22),
        end_datetime=_datetime(day=26, hour=2),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": result.is_closed,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Same day timespans | Time Start is after first time span": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="14:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=16)),
            ),
            "Same day timespans | Time start in the middle of first time span": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="11:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=11)),
            ),
            "Same day timespans | Time start in the middle of first time span, minimum duration": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="11:00",
                    reservable_minimum_duration_minutes=120,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=16)),
            ),
            "Same day timespans | Time start in first time span, ends in last last, minimum duration": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_start="11:00",
                    reservable_time_end="17:00",
                    reservable_minimum_duration_minutes=120,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=None),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__time_spans_same_day(graphql, reservation_unit, filters, result):
    """Cases where a single day contains multiple time spans"""
    # Two time spans in the same day
    # 2023-05-20 10:00-12:00 (2h)
    # 2023-05-20 16:00-20:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=20, hour=10),
        end_datetime=_datetime(day=20, hour=12),
    )
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=20, hour=16),
        end_datetime=_datetime(day=20, hour=20),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": result.is_closed,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Multi-day | Time on the first day": ReservableParams(
                filters=ReservableFilters(
                    reservable_date_start="2023-06-01",
                    reservable_time_start="14:00:00",
                    reservable_time_end="16:00:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(month=6, day=1, hour=14)),
            ),
            "Multi-day | Time on the second day": ReservableParams(
                filters=ReservableFilters(
                    reservable_date_start="2023-06-02",
                    reservable_time_start="14:00:00",
                    reservable_time_end="16:00:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(month=6, day=2, hour=14)),
            ),
            "Multi-day | Time End filter causes midnight of second day to be returned": ReservableParams(
                filters=ReservableFilters(
                    reservable_time_end="12:59:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(month=6, day=2, hour=0)),
            ),
            "Multi-day | Minimum duration is 25 hours": ReservableParams(
                filters=ReservableFilters(
                    reservable_minimum_duration_minutes=60 * 25,  # 25 hours
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(month=6, day=1, hour=13)),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__multi_day_time_span(graphql, reservation_unit, filters, result):
    """Cases where a single time span spans multiple days"""
    # Super long time span that lasts many days
    # 2023-06-01 13:00 - 2023-06-05 13:00 (5 days)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(month=6, day=1, hour=13),
        end_datetime=_datetime(month=6, day=5, hour=13),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": result.is_closed,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "ReservationUnit Settings | reservation_begins": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_begins=_datetime(day=20, hour=17),
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "ReservationUnit Settings | reservation_begins in the middle of time span": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_begins=_datetime(day=20, hour=18, minute=1),
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=18, minute=15)),
            ),
            "ReservationUnit Settings | reservation_ends": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_ends=_datetime(day=11, hour=13),
                ),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ReservationUnit Settings | publish_ends": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    publish_ends=_datetime(day=11, hour=13),
                ),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ReservationUnit Settings | reservations_min_days_before": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservations_min_days_before=10,  # 2023-05-20
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "ReservationUnit Settings | reservations_min_days_before uses beginning of the day": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservations_min_days_before=11,  # 2023-05-21
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=21, hour=0)),
            ),
            "ReservationUnit Settings | reservations_max_days_before": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservations_max_days_before=3,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=12, hour=13)),
            ),
            "ReservationUnit Settings | reservations_max_days_before ends when time span starts": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    # Exactly 2 days from NOW. Reservation doesn't fit in time span before this point, so it's not valid
                    reservations_max_days_before=2,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=None),
            ),
            "ReservationUnit Settings | min_reservation_duration": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    min_reservation_duration=timedelta(hours=2),
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "ReservationUnit Settings | max_reservation_duration": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    max_reservation_duration=timedelta(hours=2),
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=12, hour=13)),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filter__reservation_unit_settings(
    graphql, reservation_unit, filters, result, reservation_unit_settings
):
    """ReservationUnit settings should be respected when getting the first reservable time"""
    apply_reservation_unit_override_settings(reservation_unit, reservation_unit_settings)

    # 2023-05-12 13:00-14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=12, hour=13),
        end_datetime=_datetime(day=12, hour=14),
    )
    # 2023-05-20 17:00 - 2023-05-21 21:00 (1d 4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=20, hour=17),
        end_datetime=_datetime(day=21, hour=21),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": result.is_closed,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Advanced | Min duration is longer than Max duration allowed by reservation unit": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    max_reservation_duration=timedelta(minutes=120),
                ),
                filters=ReservableFilters(
                    reservable_minimum_duration_minutes=121,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=None),
            ),
            "Advanced | Greater minimum durations is used > min_reservation_duration": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    min_reservation_duration=timedelta(minutes=61),
                ),
                filters=ReservableFilters(
                    reservable_minimum_duration_minutes=60,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Advanced | Greater minimum durations is used > reservable_minimum_duration_minutes": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    min_reservation_duration=timedelta(minutes=60),
                ),
                filters=ReservableFilters(
                    reservable_minimum_duration_minutes=61,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Advanced | Next interval is a non-default value": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_30_MINUTES,
                ),
                filters=ReservableFilters(
                    reservable_time_start="13:01:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=12, hour=13, minute=30)),
            ),
            "Advanced | Next interval doesn't leave enough duration for the minimum duration": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_30_MINUTES,
                ),
                filters=ReservableFilters(
                    reservable_time_start="13:01:00",
                    reservable_minimum_duration_minutes=31,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Advanced | Next interval is at the end of the time span": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_60_MINUTES,
                ),
                filters=ReservableFilters(
                    reservable_time_start="13:01:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Advanced | Next interval is outside time span": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_90_MINUTES,
                ),
                filters=ReservableFilters(
                    reservable_time_start="13:01:00",
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__advanced(
    graphql, reservation_unit, reservation_unit_settings, filters, result
):
    """
    A bit more advanced and complex test cases.
    These cases cover edge cases, combinations of filters and ReservationUnit field values.
    """
    apply_reservation_unit_override_settings(reservation_unit, reservation_unit_settings)

    # 2023-05-12 13:00-14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=12, hour=13),
        end_datetime=_datetime(day=12, hour=14),
    )
    # 2023-05-20 17:00-21:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=20, hour=17),
        end_datetime=_datetime(day=20, hour=21),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": result.is_closed,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@pytest.mark.parametrize(
    # For all dates we need to convert from UTC to local time before getting the date.
    **parametrize_helper(
        {
            "ApplicationRound | Period overlaps, Status=OPEN, ReservationUnit not part of round": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_datetime(day=1).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=20).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_units=[],
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=12)),
            ),
            "ApplicationRound | Period overlaps, STATUS=UPCOMING": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.UPCOMING,
                    reservation_period_begin=_datetime(day=1).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=20).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period overlaps, Status=OPEN": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_datetime(day=1).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=20).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period overlaps, Status=IN_ALLOCATION": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.IN_ALLOCATION,
                    reservation_period_begin=_datetime(day=1).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=20).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period overlaps, Status=HANDLED": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.HANDLED,
                    reservation_period_begin=_datetime(day=1).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=20).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period overlaps, Status=RESULTS_SENT": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.RESULTS_SENT,
                    reservation_period_begin=_datetime(day=1).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=20).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=12)),
            ),
            "ApplicationRound | Not overlapping, Period in the past, Status=UPCOMING": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.UPCOMING,
                    reservation_period_begin=_datetime(day=1).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=10).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=12)),
            ),
            "ApplicationRound | Not overlapping, Period in the future, Status=OPEN": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_datetime(day=20).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=30).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=12)),
            ),
            "ApplicationRound | Period partially overlaps, Status=OPEN": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_datetime(day=14).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=15).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=16, hour=0)),
            ),
            "ApplicationRound | Period partially overlaps, Status=OPEN, Min duration too long": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_datetime(day=14).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=15).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(
                    reservable_minimum_duration_minutes=61,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period ends on the day of time span, STATUS=OPEN": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_datetime(day=14).astimezone(DEFAULT_TIMEZONE).date(),
                    reservation_period_end=_datetime(day=16).astimezone(DEFAULT_TIMEZONE).date(),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__application_round(
    graphql, reservation_unit, application_round_params, filters, result
):
    if application_round_params.reservation_units is None:
        application_round_params.reservation_units = [reservation_unit]

    ApplicationRoundFactory.create_in_status(
        **{k: v for k, v in asdict(application_round_params).items() if v is not None}
    )

    # 2023-05-15 12:00 - 2023-05-16 01:00 (13h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=15, hour=12),
        end_datetime=_datetime(day=16, hour=1),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": result.is_closed,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__application_round__start_date_at_round_last_day(
    graphql, reservation_unit
):
    """
    This is a regression tests that was found during manual testing.
    Simply recreate the exact scenario instead of using the above test cases.
    """
    ApplicationRoundFactory.create_in_status_open(
        reservation_period_begin=date(year=2024, month=3, day=1),
        reservation_period_end=date(year=2024, month=3, day=30),
        reservation_units=[reservation_unit],
    )

    # 2024-03-29 09:00 - 11:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(year=2024, month=3, day=29, hour=9),
        end_datetime=_datetime(year=2024, month=3, day=29, hour=11),
    )

    # 2024-03-29 12:00 - 20:00 (8h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(year=2024, month=3, day=29, hour=12),
        end_datetime=_datetime(year=2024, month=3, day=29, hour=20),
    )

    # 2024-03-30 11:00 - 12:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(year=2024, month=3, day=30, hour=11),
        end_datetime=_datetime(year=2024, month=3, day=30, hour=12),
    )

    # 2024-03-30 13:00 - 18:00 (5h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(year=2024, month=3, day=30, hour=13),
        end_datetime=_datetime(year=2024, month=3, day=30, hour=18),
    )

    # 2024-03-31 11:00 - 12:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(year=2024, month=3, day=31, hour=11),
        end_datetime=_datetime(year=2024, month=3, day=31, hour=12),
    )

    # 2024-03-31 13:00 - 18:00 (5h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(year=2024, month=3, day=31, hour=13),
        end_datetime=_datetime(year=2024, month=3, day=31, hour=18),
    )

    query = reservation_units_reservable_query(
        reservable_date_start="2024-03-30",
        reservable_date_end="2024-03-31",
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(year=2024, month=3, day=31, hour=11).isoformat(),
    }
