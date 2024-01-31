from dataclasses import asdict, dataclass
from datetime import UTC, date, datetime, time, timedelta
from functools import partial
from typing import NamedTuple

import freezegun
import pytest

from applications.choices import ApplicationRoundStatusChoice
from common.date_utils import DEFAULT_TIMEZONE
from reservation_units.enums import ReservationStartInterval
from reservation_units.models import ReservationUnit
from reservations.choices import ReservationStateChoice
from tests.factories import (
    ApplicationRoundFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ResourceFactory,
    SpaceFactory,
)
from tests.helpers import parametrize_helper

from .helpers import reservation_units_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]

reservation_units_reservable_query = partial(reservation_units_query, fields="isClosed firstReservableDatetime")


def _datetime(year=2024, month=1, day=1, hour=0, minute=0) -> datetime:
    # Convert to UTC to match timezone returned by GQL endpoint
    return datetime(year, month, day, hour, minute).astimezone(DEFAULT_TIMEZONE).astimezone(UTC)


def _date(year=2024, month=1, day=1) -> date:
    return date(year, month, day)


NOW = _datetime()
YESTERDAY = _datetime(year=2023, month=12, day=31)


@pytest.fixture()
def reservation_unit() -> ReservationUnit:
    origin_hauki_resource = OriginHaukiResourceFactory(
        id="999",
        opening_hours_hash="test_hash",
        latest_fetched_date=date(2024, 12, 31),
    )
    reservation_unit = ReservationUnitFactory.create(
        origin_hauki_resource=origin_hauki_resource,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES.value,
        reservation_begins=None,
        reservation_ends=None,
        reservations_min_days_before=None,
        reservations_max_days_before=None,
        min_reservation_duration=None,
        max_reservation_duration=None,
        buffer_time_before=timedelta(),
        buffer_time_after=timedelta(),
    )
    return reservation_unit


def create_child_for_reservation_unit(reservation_unit: ReservationUnit) -> ReservationUnit:
    parent_space = reservation_unit.spaces.all().first()
    if not parent_space:
        parent_space = SpaceFactory()
        reservation_unit.spaces.set([parent_space])
    reservation_unit.name = "Parent ReservationUnit"
    reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_30_MINUTES.value
    reservation_unit.unit = parent_space.unit
    reservation_unit.save()

    child_space = SpaceFactory.create(parent=parent_space)

    return ReservationUnitFactory.create(
        buffer_time_before=timedelta(),
        buffer_time_after=timedelta(),
        reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
        origin_hauki_resource=reservation_unit.origin_hauki_resource,
        spaces=[child_space],
        unit=child_space.unit,
    )


@dataclass
class ReservableFilters:
    reservable_date_start: str | None = None
    reservable_date_end: str | None = None
    reservable_time_start: str | None = None
    reservable_time_end: str | None = None
    reservable_minimum_duration_minutes: int | None = None
    show_only_reservable: bool | None = None

    def __init__(
        self,
        date_start: date | None = None,
        date_end: date | None = None,
        time_start: time | None = None,
        time_end: time | None = None,
        minimum_duration_minutes: int | None = None,
        show_only_reservable: bool | None = None,
    ):
        self.reservable_date_start = date_start.isoformat() if date_start else None
        self.reservable_date_end = date_end.isoformat() if date_end else None
        self.reservable_time_start = time_start.isoformat() if time_start else None
        self.reservable_time_end = time_end.isoformat() if time_end else None
        self.reservable_minimum_duration_minutes = minimum_duration_minutes
        self.show_only_reservable = show_only_reservable


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
    buffer_time_before: timedelta | None = None
    buffer_time_after: timedelta | None = None


@dataclass
class ApplicationStatusParams:
    status: ApplicationRoundStatusChoice
    sent_date: datetime | None = None
    handled_date: datetime | None = None
    reservation_period_begin: date | None = None
    reservation_period_end: date | None = None
    reservation_units: list[ReservationUnit] | None = None


@dataclass
class ReservableNode:
    is_closed: bool | None
    first_reservable_datetime: str | None

    def __init__(self, is_closed: bool | None = None, first_reservable_datetime: datetime | None = None):
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


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__no_results_time_spans_dont_exist(graphql, reservation_unit):
    """When there are no time spans, the first reservable time should be None."""
    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert response.node(0) == {"isClosed": True, "firstReservableDatetime": None}


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Date Start is in the past": ReservableParams(
                filters=ReservableFilters(date_start=(NOW - timedelta(days=1)).date()),
                result="'reservable_date_start' must be not be in the past.",
            ),
            "Date End is in the past": ReservableParams(
                filters=ReservableFilters(date_end=(NOW - timedelta(days=1)).date()),
                result="'reservable_date_end' must be not be in the past.",
            ),
            "Date End is before Date Start": ReservableParams(
                filters=ReservableFilters(date_start=_date(day=10), date_end=_date(day=9)),
                result="'reservable_date_start' must be before 'reservable_date_end'.",
            ),
            "Time Start and End filters exact start time": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=15), time_end=time(hour=15)),
                result="'reservable_time_start' must be before 'reservable_time_end'.",
            ),
            "Minimum duration minutes is zero": ReservableParams(
                filters=ReservableFilters(minimum_duration_minutes=0),
                result="'minimum_duration_minutes' can not be less than '15'.",
            ),
            "Minimum duration minutes less than 15": ReservableParams(
                filters=ReservableFilters(minimum_duration_minutes=14),
                result="'minimum_duration_minutes' can not be less than '15'.",
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__filters__invalid_values(
    graphql, reservation_unit, filters, result
):
    """Invalid filter values should return an error"""
    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is True, response
    assert result in response.error_message() == result


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "No Results | Date Start is after the last reservable time": ReservableParams(
                filters=ReservableFilters(date_start=_date(day=3)),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Date End is before next reservable time": ReservableParams(
                filters=ReservableFilters(date_end=_date(day=1)),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Time Start is when time span ends": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=19)),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Time Start is after all reservable times have ended": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=19, minute=1)),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Time End is when time span starts": ReservableParams(
                filters=ReservableFilters(time_end=time(hour=15)),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Time End is before any reservable time begins": ReservableParams(
                filters=ReservableFilters(time_end=time(hour=14, minute=59)),
                result=ReservableNode(is_closed=True),
            ),
            "No Results | Minimum Duration Minutes is longer than reservable time span": ReservableParams(
                filters=ReservableFilters(minimum_duration_minutes=241),  # 4 hours + 1 minute
                result=ReservableNode(is_closed=False),
            ),
            "No Results | Time Start and Minimum duration cause reservable time to be too short": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=18, minute=1), minimum_duration_minutes=60),
                result=ReservableNode(is_closed=False),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__filters__too_strict_causes_no_first_reservable_time_exists(
    graphql, reservation_unit, filters, result
):
    """
    Filters that are too strict and cause no results to be returned.
    Also make sure certain filters affect the isClosed value correctly.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # 2024-01-01 15:00 - 19:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=2, hour=15),
        end_datetime=_datetime(day=2, hour=19),
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
            "Basic | No filters": ReservableParams(filters=ReservableFilters()),
            "Basic | Only Date Start": ReservableParams(filters=ReservableFilters(date_start=_date())),
            "Basic | Only Date End": ReservableParams(filters=ReservableFilters(date_end=_date(day=31))),
            "Basic | Start & End Date | Filters same as time span": ReservableParams(
                filters=ReservableFilters(date_start=_date(), date_end=_date()),
            ),
            "Basic | Only Time Start": ReservableParams(filters=ReservableFilters(time_start=time(hour=13))),
            "Basic | Only Time End": ReservableParams(filters=ReservableFilters(time_end=time(hour=14))),
            "Basic | Start & End Time | Filters same as time span": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=13), time_end=time(hour=14)),
            ),
            "Basic | Only reservable_minimum_duration_minutes| Shorter than time span": ReservableParams(
                filters=ReservableFilters(minimum_duration_minutes=30)
            ),
            "Basic | Only reservable_minimum_duration_minutes | Same length as time span": ReservableParams(
                filters=ReservableFilters(minimum_duration_minutes=60),
            ),
            "Basic | Only show_only_reservable True": ReservableParams(
                filters=ReservableFilters(show_only_reservable=True),
            ),
            "Basic | Only show_only_reservable False": ReservableParams(
                filters=ReservableFilters(show_only_reservable=False),
            ),
            "Basic | All filters": ReservableParams(
                filters=ReservableFilters(
                    date_start=_date(),
                    date_end=_date(day=30),
                    time_start=time(),
                    time_end=time(hour=23, minute=59),
                    minimum_duration_minutes=30,
                    show_only_reservable=False,
                ),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit_reservable__filters__should_not_exclude_time_span(
    graphql, reservation_unit, filters, result
):
    """
    Filters with 'basic' values, which should never exclude the correct first reservable time.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │31 ░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░ │
    │ 1 ░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # Reservable Time Span is in the past, should never be returned
    # 2023-12-31 13:00 - 14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=YESTERDAY + timedelta(hours=13),
        end_datetime=YESTERDAY + timedelta(hours=14),
    )
    # Next available Reservable Time Span
    # 2024-01-01 13:00 - 14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=13),
        end_datetime=_datetime(hour=14),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=13).isoformat(),
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Simple | Date Start in the future": ReservableParams(
                filters=ReservableFilters(date_start=_date(day=10)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=10, hour=16)),
            ),
            "Simple | Time End filter is early in the morning": ReservableParams(
                filters=ReservableFilters(time_end=time(hour=9)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=5, hour=7)),
            ),
            "Simple | Minimum Duration Minutes matches time span duration exactly": ReservableParams(
                filters=ReservableFilters(minimum_duration_minutes=240),
                result=ReservableNode(first_reservable_datetime=_datetime(day=10, hour=16)),
            ),
            "Simple | Time Start is after Time Span start time, return valid next interval": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=12, minute=1)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=1, hour=12, minute=15)),
            ),
            "Simple | Time Start filter is at next interval, since it's valid it should be returned": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=12, minute=1)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=1, hour=12, minute=15)),
            ),
            "Simple | Time Start and End filters together match time span exactly": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=16), time_end=time(hour=20)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=10, hour=16)),
            ),
            "Simple | Time Start and End only partially contain the ReservableTimeSpan from start": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=16, minute=1), time_end=time(hour=20)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=10, hour=16, minute=15)),
            ),
            "Simple | Time Start and End only partially contain the ReservableTimeSpan from end": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=16), time_end=time(hour=19, minute=59)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=10, hour=16)),
            ),
            "Simple | Time Start late at night, reservation ends at midnight": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=22), minimum_duration_minutes=120),
                result=ReservableNode(first_reservable_datetime=_datetime(day=15, hour=22)),
            ),
            "Simple | Time Start is at midnight on time spans second day": ReservableParams(
                filters=ReservableFilters(date_start=_date(day=16), time_start=time(hour=0)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=16, hour=0)),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__filters__simple(graphql, reservation_unit, filters, result):
    """
    Filters with 'simple' values, which are a bit more advanced than the previous test.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░░░ │
    │ 5 ░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
    │10 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁▁▁░░░░░░ │
    │15 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁▁▁ │
    │16 ▁▁▁▁░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # 2024-01-01 12:00 - 13:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=1, hour=12),
        end_datetime=_datetime(day=1, hour=13),
    )
    # 2024-01-05 07:00 - 09:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=5, hour=7),
        end_datetime=_datetime(day=5, hour=9),
    )
    # 2024-01-10 16:00 - 20:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=10, hour=16),
        end_datetime=_datetime(day=10, hour=20),
    )
    # 2024-01-15 22:00 - 2024-01-16 02:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=15, hour=22),
        end_datetime=_datetime(day=16, hour=2),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Same day timespans | Time Start is after first time span": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=14)),
                result=ReservableNode(first_reservable_datetime=_datetime(hour=16)),
            ),
            "Same day timespans | Time start in the middle of first time span": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=11)),
                result=ReservableNode(first_reservable_datetime=_datetime(hour=11)),
            ),
            "Same day timespans | Time start in the middle of first time span, minimum duration": ReservableParams(
                filters=ReservableFilters(time_start=time(hour=11), minimum_duration_minutes=120),
                result=ReservableNode(first_reservable_datetime=_datetime(hour=16)),
            ),
            "Same day timespans | Time start in first time span, ends in last last, minimum duration": ReservableParams(
                filters=ReservableFilters(
                    time_start=time(hour=11),
                    time_end=time(hour=17),
                    minimum_duration_minutes=120,
                ),
                result=ReservableNode(first_reservable_datetime=None),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__filters__multiple_time_spans_on_the_same_day(
    graphql, reservation_unit, filters, result
):
    """
    Cases where a single day contains multiple time spans.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁░░░░░░░░▁▁▁▁▁▁▁▁░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # 2024-01-01 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )
    # 2024-01-01 16:00 - 20:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=16),
        end_datetime=_datetime(hour=20),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Multi-day | Time on the first day": ReservableParams(
                filters=ReservableFilters(
                    date_start=_date(day=1),
                    time_start=time(hour=14),
                    time_end=time(hour=16),
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=1, hour=14)),
            ),
            "Multi-day | Time on the second day": ReservableParams(
                filters=ReservableFilters(
                    date_start=_date(day=2),
                    time_start=time(hour=14),
                    time_end=time(hour=16),
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=2, hour=14)),
            ),
            "Multi-day | Time End filter causes midnight of second day to be returned": ReservableParams(
                filters=ReservableFilters(time_end=time(hour=12, minute=59)),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=2, hour=0)),
            ),
            "Multi-day | Minimum duration is 25 hours": ReservableParams(
                filters=ReservableFilters(minimum_duration_minutes=60 * 25),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=1, hour=13)),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__filters__multiple_days_long_time_span(
    graphql, reservation_unit, filters, result
):
    """
    Cases where a single time span spans multiple days.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
    │ 2 ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
    │ 3 ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
    │ 4 ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
    │ 5 ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # Super long time span that lasts many days
    # 2024-01-01 13:00 - 2024-01-05 13:00 (4 days)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=1, hour=13),
        end_datetime=_datetime(day=5, hour=13),
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
            "ReservationUnit Settings | reservation_ends causes no results": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_ends=_datetime(day=11),
                ),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ReservationUnit Settings | publish_ends causes no results": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    publish_ends=_datetime(day=11, hour=13),
                ),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ReservationUnit Settings | reservations_min_days_before": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservations_min_days_before=19,  # 2024-01-20
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "ReservationUnit Settings | reservations_min_days_before uses beginning of the day": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservations_min_days_before=20,  # 2024-01-21
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=21, hour=0)),
            ),
            "ReservationUnit Settings | reservations_max_days_before": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservations_max_days_before=12,  # 2024-01-13
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=12, hour=13)),
            ),
            "ReservationUnit Settings | reservations_max_days_before uses beginning of the day": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservations_max_days_before=11,  # 2024-01-12
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
def test__query_reservation_unit__first_reservable_time__reservation_unit_settings(
    graphql, reservation_unit, filters, result, reservation_unit_settings
):
    """
    ReservationUnit settings should be respected when getting the first reservable time.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │12 ░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░ │
    │20 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
    │21 ▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    apply_reservation_unit_override_settings(reservation_unit, reservation_unit_settings)

    # 2024-01-12 13:00 - 14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=12, hour=13),
        end_datetime=_datetime(day=12, hour=14),
    )
    # 2024-01-20 17:00 - 2024-01-21 21:00 (1d 4h)
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
                filters=ReservableFilters(minimum_duration_minutes=121),
                result=ReservableNode(first_reservable_datetime=None),
            ),
            "Advanced | Greater minimum durations is used > min_reservation_duration": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    min_reservation_duration=timedelta(minutes=61),
                ),
                filters=ReservableFilters(minimum_duration_minutes=60),
                result=ReservableNode(first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Advanced | Greater minimum durations is used > reservable_minimum_duration_minutes": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    min_reservation_duration=timedelta(minutes=60),
                ),
                filters=ReservableFilters(minimum_duration_minutes=61),
                result=ReservableNode(first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Advanced | Next interval is a non-default value": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
                ),
                filters=ReservableFilters(time_start=time(hour=13, minute=1)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=12, hour=13, minute=30)),
            ),
            "Advanced | Next interval doesn't leave enough duration for the minimum duration": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
                ),
                filters=ReservableFilters(time_start=time(hour=13, minute=1), minimum_duration_minutes=31),
                result=ReservableNode(first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Advanced | Next interval is at the end of the time span": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_start_interval=ReservationStartInterval.INTERVAL_60_MINUTES.value,
                ),
                filters=ReservableFilters(time_start=time(hour=13, minute=1)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=20, hour=17)),
            ),
            "Advanced | Next interval is outside time span": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    reservation_start_interval=ReservationStartInterval.INTERVAL_90_MINUTES.value,
                ),
                filters=ReservableFilters(time_start=time(hour=13, minute=31)),
                result=ReservableNode(first_reservable_datetime=_datetime(day=20, hour=18)),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__filters_and_reservation_unit_settings_combined(
    graphql, reservation_unit, reservation_unit_settings, filters, result
):
    """
    A bit more advanced and complex test cases.
    These cases cover edge cases, combinations of filters and ReservationUnit field values.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │12 ░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░ │
    │20 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    apply_reservation_unit_override_settings(reservation_unit, reservation_unit_settings)

    # 2024-01-12 13:00 - 14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=12, hour=13),
        end_datetime=_datetime(day=12, hour=14),
    )
    # 2024-01-20 17:00 - 21:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=20, hour=17),
        end_datetime=_datetime(day=20, hour=21),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "ApplicationRound | Period overlaps, Status=OPEN, ReservationUnit not part of round": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_date(day=1),
                    reservation_period_end=_date(day=20),
                    reservation_units=[],
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=12)),
            ),
            "ApplicationRound | Period overlaps, STATUS=UPCOMING": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.UPCOMING,
                    reservation_period_begin=_date(day=1),
                    reservation_period_end=_date(day=20),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period overlaps, Status=OPEN": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_date(day=1),
                    reservation_period_end=_date(day=20),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period overlaps, Status=IN_ALLOCATION": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.IN_ALLOCATION,
                    reservation_period_begin=_date(day=1),
                    reservation_period_end=_date(day=20),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period overlaps, Status=HANDLED": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.HANDLED,
                    reservation_period_begin=_date(day=1),
                    reservation_period_end=_date(day=20),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period overlaps, Status=RESULTS_SENT": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.RESULTS_SENT,
                    reservation_period_begin=_date(day=1),
                    reservation_period_end=_date(day=20),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=12)),
            ),
            "ApplicationRound | Not overlapping, Period in the past, Status=UPCOMING": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.UPCOMING,
                    reservation_period_begin=_date(day=1),
                    reservation_period_end=_date(day=10),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=12)),
            ),
            "ApplicationRound | Not overlapping, Period in the future, Status=OPEN": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_date(day=20),
                    reservation_period_end=_date(day=30),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=15, hour=12)),
            ),
            "ApplicationRound | Period partially overlaps, Status=OPEN": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_date(day=14),
                    reservation_period_end=_date(day=15),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=False, first_reservable_datetime=_datetime(day=16, hour=0)),
            ),
            "ApplicationRound | Period partially overlaps, Status=OPEN, Min duration too long": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_date(day=14),
                    reservation_period_end=_date(day=15),
                ),
                filters=ReservableFilters(
                    minimum_duration_minutes=61,
                ),
                result=ReservableNode(is_closed=False, first_reservable_datetime=None),
            ),
            "ApplicationRound | Period ends on the day of time span, STATUS=OPEN": AR_ReservableParams(
                application_round_params=ApplicationStatusParams(
                    status=ApplicationRoundStatusChoice.OPEN,
                    reservation_period_begin=_date(day=14),
                    reservation_period_end=_date(day=16),
                ),
                filters=ReservableFilters(),
                result=ReservableNode(is_closed=True, first_reservable_datetime=None),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__application_rounds(
    graphql, reservation_unit, application_round_params, filters, result
):
    """
    Cases where ApplicationRounds with different statuses affect the first reservable time

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │15 ░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁ │
    │16 ▁▁░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    if application_round_params.reservation_units is None:
        application_round_params.reservation_units = [reservation_unit]

    ApplicationRoundFactory.create_in_status(
        **{k: v for k, v in asdict(application_round_params).items() if v is not None}
    )

    # 2024-01-15 12:00 - 2024-01-16 01:00 (13h)
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
def test__query_reservation_unit__first_reservable_time__filters__application_rounds__start_date_at_round_last_day(
    graphql, reservation_unit
):
    """
    This is a regression test for a bug that was found during manual testing.

    The issue occurred when an ApplicationRound's period ended on the same day as the filter start date.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │29 ░░░░░░░░░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░░░░░ │
    │30 ░░░░░░░░░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░░░░░ │
    │31 ░░░░░░░░░░░░░░░░░░░░░░▁▁░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    ApplicationRoundFactory.create_in_status_open(
        reservation_units=[reservation_unit],
        reservation_period_begin=_date(day=29),
        reservation_period_end=_date(day=30),
    )

    # 2024-01-29 11:00 - 12:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=29, hour=11),
        end_datetime=_datetime(day=29, hour=12),
    )
    # 2024-01-30 11:00 - 12:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=30, hour=11),
        end_datetime=_datetime(day=30, hour=12),
    )
    # 2024-01-31 11:00 - 12:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=31, hour=11),
        end_datetime=_datetime(day=31, hour=12),
    )

    response = graphql(
        reservation_units_reservable_query(
            reservable_date_start="2024-01-30",
            reservable_date_end="2024-01-31",
        )
    )

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(day=31, hour=11).isoformat(),
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__reservations__own_reservation_block_reservable_time(
    graphql, reservation_unit
):
    """
    Make sure that reservations that belong to the reservation unit block the time span from being returned

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │20 ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # 2024-01-20 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=_datetime(hour=10),
        end=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": None,
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__reservations__unrelated_reservation_should_not_affect(
    graphql, reservation_unit
):
    """
    Make sure that reservations in unrelated reservation units do not affect availability.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit                                   │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁░░░░░░░░░░░░░░░░░░░░░░░░ │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_2                                 │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit_2: ReservationUnit = ReservationUnitFactory()

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_2,
        begin=_datetime(hour=10),
        end=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=10).isoformat(),
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__reservations__dont_include_cancelled_or_denied_reservations(
    graphql,
    reservation_unit,
):
    """
    Cancelled and Denied reservations should not be included in the calculation of the first reservable time.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_30_MINUTES.value
    reservation_unit.save()

    # 2024-01-01 10:00 - 20:00 (12h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=20),
    )

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=_datetime(hour=10),
        end=_datetime(hour=12),
        state=ReservationStateChoice.CANCELLED,
    )
    # 2024-01-01 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=_datetime(hour=10),
        end=_datetime(hour=12),
        state=ReservationStateChoice.DENIED,
    )

    response = graphql(
        reservation_units_reservable_query(
            reservable_date_start="2024-01-01",
            reservable_date_end="2024-01-01",
        )
    )

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=10).isoformat(),
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__reservations__date_filters_on_same_day_as_reservation(
    graphql, reservation_unit
):
    """
    This is a regression test for a bug that was found during manual testing.

    The issue occurred when user filtered by a date range, and the reservation was not correctly found when the
    date of the reservation was the same as the start and end date of the filter.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁██████████▁▁▁▁▁▁░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # 2024-01-01 08:00 - 20:00 (12h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=8),
        end_datetime=_datetime(hour=20),
    )

    # 2024-01-01 12:00 - 17:00 (5h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=_datetime(hour=12),
        end=_datetime(hour=17),
    )

    response = graphql(
        reservation_units_reservable_query(
            reservable_date_start="2024-01-01",
            reservable_date_end="2024-01-01",
            reservable_time_start="12:00:00",
            reservable_time_end="17:00:00",
        )
    )

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": None,
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__reservations__filter_start_time_at_reservation_start(
    graphql,
    reservation_unit,
):
    """
    This is a regression test for a bug that was found during manual testing.

    The issue occurred when user filtered by a time range, there was problems caused by timezones.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁▁▁▁▁███▁▁▁▁▁▁▁▁▁▁░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_30_MINUTES.value
    reservation_unit.save()

    # 2024-01-01 08:00 - 20:30 (12h 30min)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=8),
        end_datetime=_datetime(hour=20, minute=30),
    )

    # 2024-01-01 14:00 - 15:30 (1h 30min)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=_datetime(hour=14),
        end=_datetime(hour=15, minute=30),
    )

    response = graphql(
        reservation_units_reservable_query(
            reservable_time_start="14:00:00",
            reservable_time_end="18:00:00",
            reservable_minimum_duration_minutes=60,
        ),
    )

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=15, minute=30).isoformat(),
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__reservations__in_common_hierarchy__by_space(
    graphql, reservation_unit
):
    """
    Reservations from reservation units in the same hierarchy, connected by spaces, should block the time span from
    being returned.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit                                   │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁░░░░░░░░░░░░░░░░░░░░░░░░ │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_2                                 │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit_2: ReservationUnit = ReservationUnitFactory(
        spaces=[SpaceFactory.create()],
        origin_hauki_resource=reservation_unit.origin_hauki_resource,
    )
    reservation_unit.unit = reservation_unit_2.unit
    reservation_unit.spaces.set(reservation_unit_2.spaces.all())
    reservation_unit.save()

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_2,
        begin=_datetime(hour=10),
        end=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "isClosed": False,
        "firstReservableDatetime": None,
    }
    assert response.node(1) == {
        "pk": reservation_unit_2.pk,
        "isClosed": False,
        "firstReservableDatetime": None,
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__reservations__in_common_hierarchy__by_resource(
    graphql, reservation_unit
):
    """
    Reservations from reservation units in the same hierarchy, connected by resources, should block the time span from
    being returned.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit                                   │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁░░░░░░░░░░░░░░░░░░░░░░░░ │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_2                                 │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit_2: ReservationUnit = ReservationUnitFactory.create(
        resources=[ResourceFactory()],
        origin_hauki_resource=reservation_unit.origin_hauki_resource,
    )
    reservation_unit.unit = reservation_unit_2.unit
    reservation_unit.resources.set(reservation_unit_2.resources.all())
    reservation_unit.save()

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_2,
        begin=_datetime(hour=10),
        end=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "isClosed": False,
        "firstReservableDatetime": None,
    }
    assert response.node(1) == {
        "pk": reservation_unit_2.pk,
        "isClosed": False,
        "firstReservableDatetime": None,
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__reservations__in_common_hierarchy__by_resource__and_filters(
    graphql, reservation_unit
):
    """
    This is a regression test for a bug that was found during manual testing.

    The issue occurred when the ReservationUnit GQL query had additional filters that filtered out ReservationUnits
    which were related in common hierarchy by Resource and had a Space which was not related in common hierarchy.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit                                   │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁░░░░░░░░░░░░░░░░░░░░░░░░ │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_2                                 │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░████░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    common_resource = ResourceFactory()

    reservation_unit.resources.set([common_resource])
    reservation_unit.spaces.set([SpaceFactory()])
    reservation_unit.save()

    reservation_unit_2: ReservationUnit = ReservationUnitFactory.create(
        resources=[common_resource],
        spaces=[SpaceFactory()],
        origin_hauki_resource=reservation_unit.origin_hauki_resource,
    )

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_2,
        begin=_datetime(hour=10),
        end=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "isClosed": False,
        "firstReservableDatetime": None,
    }
    assert response.node(1) == {
        "pk": reservation_unit_2.pk,
        "isClosed": False,
        "firstReservableDatetime": None,
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__buffers__goes_over_closed_time(graphql, reservation_unit):
    """
    ReservationUnits before and after buffers should not affect reservability when the buffer is in a closed time span.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    │ ═ = First reservable time                          │
    │ ─ = Reservation Unit Buffer                        │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁░░░░░░░░░░░░░░░░░░░░░░ │
    │                     ──═──                          │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_30_MINUTES.value
    reservation_unit.buffer_time_before = timedelta(minutes=60)
    reservation_unit.buffer_time_after = timedelta(minutes=60)
    reservation_unit.min_reservation_duration = timedelta(minutes=30)
    reservation_unit.save()

    # 2024-01-01 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=10).isoformat(),
    }


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Buffers | Different length buffers are overlapping": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    buffer_time_before=timedelta(minutes=60),
                    buffer_time_after=timedelta(minutes=60),
                ),
                result=ReservableNode(first_reservable_datetime=_datetime(hour=16, minute=30)),
            ),
            "Buffers | Asymmetric different length buffers are overlapping": RU_ReservableParams(
                reservation_unit_settings=ReservationUnitOverrides(
                    buffer_time_before=timedelta(),
                    buffer_time_after=timedelta(minutes=60),
                ),
                result=ReservableNode(first_reservable_datetime=_datetime(hour=16)),
            ),
        }
    )
)
@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__buffers__different_length_buffers_are_overlapping(
    graphql, reservation_unit, filters, result, reservation_unit_settings
):
    """
    Make sure that ReservationUnit buffers and Reservation buffers of different lengths are correctly
    taken into account when calculating the first reservable time.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ▄ = Reservation Buffer                             │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    │ ═ = First reservable time                          │
    │ ─ = Reservation Unit Buffer                        │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit                                   │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░▄███▄▁▄█████▄▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                          ─═─                       │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_60 | -60+60                       │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░▄███▄▁▄█████▄▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                                  ──═──             │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_60 | -0+60                        │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░▄███▄▁▄█████▄▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                                   ═──              │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit.buffer_time_before = timedelta(minutes=30)
    reservation_unit.buffer_time_after = timedelta(minutes=30)
    reservation_unit.save()

    reservation_unit_60: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    apply_reservation_unit_override_settings(reservation_unit_60, reservation_unit_settings)

    # 2024-01-01 10:00 - 20:00 (10h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=20),
    )

    # 2024-01-01 10:00 - 11:30 (1h 30min) | Buffer: 9:30-10:00 + 11:30-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=_datetime(hour=10),
        end=_datetime(hour=11, minute=30),
    )
    # 2024-01-01 13:00 - 15:30 (1h 30min) | Buffer: (?) + 15:30-16:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=_datetime(hour=13),
        end=_datetime(hour=15, minute=30),
    )

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=12).isoformat(),
    }
    assert response.node(1) == {
        "pk": reservation_unit_60.pk,
        "isClosed": False,
        "firstReservableDatetime": result.first_reservable_datetime,
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__buffers__start_and_end_same_time_different_after_buffers(
    graphql, reservation_unit
):
    """
    Make sure that ReservationUnit after buffers of different lengths and Reservation after buffers of different
    lengths are correctly taken into account when calculating the first reservable time.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ▄ = Reservation Buffer                             │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    │ ═ = First reservable time                          │
    │ ─ = Reservation Unit Buffer                        │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit (parent)                          │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░███▄▄▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                            ═                       │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_30                                │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░███▄▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                           ═─                       │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_60                                │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░███▄▄▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                            ═──                     │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit_30: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_30.name = "ReservationUnit 30 min buffer"
    reservation_unit_30.buffer_time_before = timedelta()
    reservation_unit_30.buffer_time_after = timedelta(minutes=30)
    reservation_unit_30.save()

    reservation_unit_60: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_60.name = "ReservationUnit 60 min buffer"
    reservation_unit_60.buffer_time_before = timedelta()
    reservation_unit_60.buffer_time_after = timedelta(minutes=60)
    reservation_unit_60.save()

    # 2024-01-01 10:00 - 20:00 (10h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=20),
    )

    # 2024-01-01 10:00 - 11:30 (1h 30min) | Buffer: 11:30-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_30,
        begin=_datetime(hour=10),
        end=_datetime(hour=11, minute=30),
    )
    # 2024-01-01 10:00 - 11:30 (1h 30min) | Buffer: 11:30-12:30
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_60,
        begin=_datetime(hour=10),
        end=_datetime(hour=11, minute=30),
    )

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=12, minute=30).isoformat(),
    }
    assert response.node(1) == {
        "pk": reservation_unit_30.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=12).isoformat(),
    }
    assert response.node(2) == {
        "pk": reservation_unit_60.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=12, minute=30).isoformat(),
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__buffers__different_before_buffers__before_reservation(
    graphql, reservation_unit
):
    """
    Make sure that ReservationUnit before buffers of different lengths and Reservation before buffers of different
    lengths are correctly taken into account when calculating the first reservable time.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ▄ = Reservation Buffer                             │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    │ ═ = First reservable time                          │
    │ ─ = Reservation Unit Buffer                        │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit (parent)                          │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░█▁▁▄██▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                        ═                           │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_30                                │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░█▁▁▄██▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                        ─═                          │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_60                                │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░█▁▄▄██▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                             ──═                    │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit_30: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_30.name = "ReservationUnit 30 min buffer"
    reservation_unit_30.buffer_time_before = timedelta(minutes=30)
    reservation_unit_30.buffer_time_after = timedelta()
    reservation_unit_30.save()

    reservation_unit_60: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_60.name = "ReservationUnit 60 min buffer"
    reservation_unit_60.buffer_time_before = timedelta(minutes=60)
    reservation_unit_60.buffer_time_after = timedelta()
    reservation_unit_60.save()

    # 2024-01-01 10:00 - 20:00 (10h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=20),
    )

    # 2024-01-01 10:00 - 10:30 (30min)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begin=_datetime(hour=10),
        end=_datetime(hour=10, minute=30),
    )
    # 2024-01-01 12:00 - 13:00 (1h) | Buffer: 11:30-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_30,
        begin=_datetime(hour=12),
        end=_datetime(hour=13),
    )
    # 2024-01-01 12:00 - 13:00 (1h) | Buffer: 11:00-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_60,
        begin=_datetime(hour=12),
        end=_datetime(hour=13),
    )

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=10, minute=30).isoformat(),
    }
    assert response.node(1) == {
        "pk": reservation_unit_30.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=11).isoformat(),
    }
    assert response.node(2) == {
        "pk": reservation_unit_60.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=14).isoformat(),
    }


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__query_reservation_unit__first_reservable_time__buffers__different_before_buffers__before_closed_time(
    graphql, reservation_unit
):
    """
    Make sure that ReservationUnit before buffers of different lengths and Reservation before buffers of different
    lengths are correctly taken into account when calculating the first reservable time.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ▄ = Reservation Buffer                             │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    │ ═ = First reservable time                          │
    │ ─ = Reservation Unit Buffer                        │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit (parent)                          │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░░▁▄▄██▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                        ═                           │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_30                                │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░░▁▁▄██▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                       ─═                           │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit_60                                │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░░▁▄▄██▁▁▁▁▁▁▁▁▁▁▁▁▁▁░░░░░░░░ │
    │                      ──═                           │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit_30: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_30.name = "ReservationUnit 30 min buffer"
    reservation_unit_30.buffer_time_before = timedelta(minutes=30)
    reservation_unit_30.buffer_time_after = timedelta()
    reservation_unit_30.save()

    reservation_unit_60: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_60.name = "ReservationUnit 60 min buffer"
    reservation_unit_60.buffer_time_before = timedelta(minutes=60)
    reservation_unit_60.buffer_time_after = timedelta()
    reservation_unit_60.save()

    # 2024-01-01 10:30-20:00 (9h 30min)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10, minute=30),
        end_datetime=_datetime(hour=20),
    )

    # 2024-01-01 12:00-13:00 (1h) | Buffer: 11:30-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_30,
        begin=_datetime(hour=12),
        end=_datetime(hour=13),
    )

    # 2024-01-01 12:00-13:00 (1h) | Buffer: 11:00-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_60,
        begin=_datetime(hour=12),
        end=_datetime(hour=13),
    )

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response
    assert response.node(0) == {
        "pk": reservation_unit.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=10, minute=30).isoformat(),
    }
    assert response.node(1) == {
        "pk": reservation_unit_30.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=10, minute=30).isoformat(),
    }
    assert response.node(2) == {
        "pk": reservation_unit_60.pk,
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=10, minute=30).isoformat(),
    }


########################################################################################################################


@freezegun.freeze_time(datetime(2024, 1, 1, 10, 0, microsecond=1).astimezone(DEFAULT_TIMEZONE))
def test__query_reservation_unit__first_reservable_time__round_current_time_to_the_next_minute(
    graphql, reservation_unit
):
    """
    This is a regression test for a bug that was found during manual testing.

    Make sure that the current time is rounded up to the next minute when calculating the first reservable time.

    ┌────────────────────────────────────────────────────┐
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    ├────────────────────────────────────────────────────┤
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁░░░░░░░░░░░░░░░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # 2024-01-01 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert response.node(0) == {
        "isClosed": False,
        "firstReservableDatetime": _datetime(hour=10, minute=15).isoformat(),
    }


########################################################################################################################
