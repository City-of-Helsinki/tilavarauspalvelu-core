from __future__ import annotations

import datetime
import json
from dataclasses import asdict, dataclass
from functools import partial
from typing import TYPE_CHECKING, Any, NamedTuple

import freezegun
import pytest
from django.core.cache import cache
from graphene_django_extensions.testing.utils import parametrize_helper

from tilavarauspalvelu.enums import (
    AccessType,
    ApplicationRoundStatusChoice,
    ReservationStartInterval,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.models import AffectingTimeSpan, ReservationUnitHierarchy
from tilavarauspalvelu.services.first_reservable_time.first_reservable_time_helper import CachedReservableTime
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import (
    ApplicationRoundFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitAccessTypeFactory,
    ReservationUnitFactory,
    ResourceFactory,
    SpaceFactory,
)

from .helpers import reservation_units_query

if TYPE_CHECKING:
    from graphene_django_extensions.testing.client import GQLResponse

    from tilavarauspalvelu.models import ReservationUnit

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

reservation_units_reservable_query = partial(
    reservation_units_query,
    fields="isClosed firstReservableDatetime",
    calculate_first_reservable_time=True,
)
reservation_units_reservable_query_access_type = partial(
    reservation_units_query,
    fields="pk isClosed firstReservableDatetime effectiveAccessType",
    calculate_first_reservable_time=True,
)
NEXT_YEAR = datetime.date.today().year + 1


def _datetime(year=NEXT_YEAR, month=1, day=1, hour=0, minute=0) -> datetime.datetime:
    # Convert to UTC to match timezone returned by GQL endpoint
    return datetime.datetime(year, month, day, hour, minute).astimezone(DEFAULT_TIMEZONE).astimezone(datetime.UTC)


def _date(year=NEXT_YEAR, month=1, day=1) -> datetime.date:
    return datetime.date(year, month, day)


def is_closed(response: GQLResponse, *, node: int = 0) -> bool:
    """Get isClosed value from response"""
    return response.node(node)["isClosed"]


def frt(response: GQLResponse, *, node: int = 0) -> str | None:
    """Get first reservable time as ISO 8601 string from response"""
    first_reservable_time: str = response.node(node)["firstReservableDatetime"]
    if first_reservable_time is None:
        return None
    return (
        datetime.datetime.fromisoformat(first_reservable_time)
        .astimezone(DEFAULT_TIMEZONE)
        .isoformat(timespec="seconds")
    )


def frt_access_type(response: GQLResponse, *, node: int = 0) -> bool:
    """Get isClosed value from response"""
    return response.node(node)["effectiveAccessType"]


def dt(*, year: int = NEXT_YEAR, month: int = 1, day: int = 1, hour: int = 0, minute: int = 0) -> str:
    """Get time in local timezone as ISO 8601 string"""
    return datetime.datetime(year, month, day, hour, minute, tzinfo=DEFAULT_TIMEZONE).isoformat(timespec="seconds")


NOW = _datetime()


@pytest.fixture(autouse=True)
def _clear_cache() -> None:
    # Cache needs to be cleared between tests so that
    # FRT calculations don't reuse results between runs.
    try:
        cache.clear()
        yield
    finally:
        cache.clear()


@pytest.fixture
def reservation_unit() -> ReservationUnit:
    origin_hauki_resource = OriginHaukiResourceFactory.create(
        id=999,
        opening_hours_hash="test_hash",
        latest_fetched_date=_date() - datetime.timedelta(days=1),
    )
    return ReservationUnitFactory.create(
        origin_hauki_resource=origin_hauki_resource,
        reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES.value,
        reservation_begins_at=None,
        reservation_ends_at=None,
        reservations_min_days_before=None,
        reservations_max_days_before=None,
        min_reservation_duration=None,
        max_reservation_duration=None,
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
    )


def create_child_for_reservation_unit(reservation_unit: ReservationUnit) -> ReservationUnit:
    parent_space = reservation_unit.spaces.all().first()
    if not parent_space:
        parent_space = SpaceFactory.create()
        reservation_unit.spaces.set([parent_space])
    reservation_unit.name = "Parent ReservationUnit"
    reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_30_MINUTES.value
    reservation_unit.unit = parent_space.unit
    reservation_unit.save()

    child_space = SpaceFactory.create(parent=parent_space)

    return ReservationUnitFactory.create(
        reservation_begins_at=None,
        reservation_ends_at=None,
        reservations_min_days_before=None,
        reservations_max_days_before=None,
        min_reservation_duration=None,
        max_reservation_duration=None,
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
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
        date_start: datetime.date | None = None,
        date_end: datetime.date | None = None,
        time_start: datetime.time | None = None,
        time_end: datetime.time | None = None,
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
    reservation_begins_at: datetime.datetime | None = None
    reservation_ends_at: datetime.datetime | None = None
    publish_ends_at: datetime.datetime | None = None
    reservations_min_days_before: int | None = None
    reservations_max_days_before: int | None = None
    min_reservation_duration: datetime.timedelta | None = None
    max_reservation_duration: datetime.timedelta | None = None
    buffer_time_before: datetime.timedelta | None = None
    buffer_time_after: datetime.timedelta | None = None


@dataclass
class ApplicationStatusParams:
    status: ApplicationRoundStatusChoice
    sent_at: datetime.datetime | None = None
    handled_at: datetime.datetime | None = None
    reservation_period_begin_date: datetime.date | None = None
    reservation_period_end_date: datetime.date | None = None
    reservation_units: list[ReservationUnit] | None = None


@dataclass
class ReservableNode:
    is_closed: bool
    first_reservable_datetime: str | None = None


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
def test__reservation_unit__first_reservable_time__no_results_time_spans_dont_exist(graphql, reservation_unit):
    """When there are no time spans, the first reservable time should be None."""
    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert response.node(0) == {"isClosed": True, "firstReservableDatetime": None}


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "Date Start is in the past": ReservableParams(
            filters=ReservableFilters(
                date_start=(NOW - datetime.timedelta(days=1)).date(),
            ),
            result="'reservable_date_start' must be not be in the past.",
        ),
        "Date End is in the past": ReservableParams(
            filters=ReservableFilters(
                date_end=(NOW - datetime.timedelta(days=1)).date(),
            ),
            result="'reservable_date_end' must be not be in the past.",
        ),
        "Date End is before Date Start": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(day=10),
                date_end=_date(day=9),
            ),
            result="'reservable_date_start' must be before 'reservable_date_end'.",
        ),
        "Time Start and End filters exact start time": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=15),
                time_end=datetime.time(hour=15),
            ),
            result="'reservable_time_start' must be before 'reservable_time_end'.",
        ),
        "Minimum duration minutes is zero": ReservableParams(
            filters=ReservableFilters(
                minimum_duration_minutes=0,
            ),
            result="'minimum_duration_minutes' can not be less than '15'.",
        ),
        "Minimum duration minutes less than 15": ReservableParams(
            filters=ReservableFilters(
                minimum_duration_minutes=14,
            ),
            result="'minimum_duration_minutes' can not be less than '15'.",
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__filters__invalid_values(graphql, reservation_unit, filters, result):
    """Invalid filter values should return an error"""
    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is True, response
    assert result in response.error_message() == result


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "No Results | Date Start is after the last reservable time": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(day=3),
            ),
            result=ReservableNode(is_closed=True),
        ),
        "No Results | Date End is before next reservable time": ReservableParams(
            filters=ReservableFilters(
                date_end=_date(day=1),
            ),
            result=ReservableNode(is_closed=True),
        ),
        "No Results | Time Start is when time span ends": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=19),
            ),
            result=ReservableNode(is_closed=True),
        ),
        "No Results | Time Start is after all reservable times have ended": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=19, minute=1),
            ),
            result=ReservableNode(is_closed=True),
        ),
        "No Results | Time End is when time span starts": ReservableParams(
            filters=ReservableFilters(
                time_end=datetime.time(hour=15),
            ),
            result=ReservableNode(is_closed=True),
        ),
        "No Results | Time End is before any reservable time begins": ReservableParams(
            filters=ReservableFilters(
                time_end=datetime.time(hour=14, minute=59),
            ),
            result=ReservableNode(is_closed=True),
        ),
        "No Results | Minimum Duration Minutes is longer than reservable time span": ReservableParams(
            filters=ReservableFilters(
                minimum_duration_minutes=241,  # 4 hours + 1 minute
            ),
            result=ReservableNode(is_closed=False),
        ),
        "No Results | Time Start and Minimum duration cause reservable time to be too short": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=18, minute=1),
                minimum_duration_minutes=60,
            ),
            result=ReservableNode(is_closed=False),
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__filters__too_strict_causes_no_first_reservable_time_exists(
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
    │ 2 ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁░░░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # 2nd Jan 15:00 - 19:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=2, hour=15),
        end_datetime=_datetime(day=2, hour=19),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert frt(response) is None
    assert is_closed(response) is result.is_closed


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "Basic | No filters": ReservableParams(
            filters=ReservableFilters(),
        ),
        "Basic | Only Date Start": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(),
            ),
        ),
        "Basic | Only Date End": ReservableParams(
            filters=ReservableFilters(
                date_end=_date(day=31),
            ),
        ),
        "Basic | Start & End Date | Filters same as time span": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(),
                date_end=_date(),
            ),
        ),
        "Basic | Only Time Start": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=13),
            ),
        ),
        "Basic | Only Time End": ReservableParams(
            filters=ReservableFilters(
                time_end=datetime.time(hour=14),
            ),
        ),
        "Basic | Start & End Time | Filters same as time span": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=13),
                time_end=datetime.time(hour=14),
            ),
        ),
        "Basic | Only reservable_minimum_duration_minutes| Shorter than time span": ReservableParams(
            filters=ReservableFilters(
                minimum_duration_minutes=30,
            )
        ),
        "Basic | Only reservable_minimum_duration_minutes | Same length as time span": ReservableParams(
            filters=ReservableFilters(
                minimum_duration_minutes=60,
            ),
        ),
        "Basic | Only show_only_reservable True": ReservableParams(
            filters=ReservableFilters(
                show_only_reservable=True,
            ),
        ),
        "Basic | Only show_only_reservable False": ReservableParams(
            filters=ReservableFilters(
                show_only_reservable=False,
            ),
        ),
        "Basic | All filters": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(),
                date_end=_date(day=30),
                time_start=datetime.time(),
                time_end=datetime.time(hour=23, minute=59),
                minimum_duration_minutes=30,
                show_only_reservable=False,
            ),
        ),
    })
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
    # 31st Dec 13:00 - 14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=13) - datetime.timedelta(days=1),
        end_datetime=_datetime(hour=14) - datetime.timedelta(days=1),
    )
    # Next available Reservable Time Span
    # 1st Jan 13:00 - 14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=13),
        end_datetime=_datetime(hour=14),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert frt(response) == dt(hour=13)
    assert is_closed(response) is False


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "Simple | Date Start in the future": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(day=10),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=10, hour=16),
            ),
        ),
        "Simple | Time End filter is early in the morning": ReservableParams(
            filters=ReservableFilters(
                time_end=datetime.time(hour=9),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=5, hour=7),
            ),
        ),
        "Simple | Minimum Duration Minutes matches time span duration exactly": ReservableParams(
            filters=ReservableFilters(
                minimum_duration_minutes=240,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=10, hour=16),
            ),
        ),
        "Simple | Time Start is after Time Span start time, return valid next interval": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=12, minute=1),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=1, hour=12, minute=15),
            ),
        ),
        "Simple | Time Start filter is at next interval, since it's valid it should be returned": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=12, minute=1),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=1, hour=12, minute=15),
            ),
        ),
        "Simple | Time Start and End filters together match time span exactly": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=16),
                time_end=datetime.time(hour=20),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=10, hour=16),
            ),
        ),
        "Simple | Time Start and End only partially contain the ReservableTimeSpan from start": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=16, minute=1),
                time_end=datetime.time(hour=20),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=10, hour=16, minute=15),
            ),
        ),
        "Simple | Time Start and End only partially contain the ReservableTimeSpan from end": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=16),
                time_end=datetime.time(hour=19, minute=59),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=10, hour=16),
            ),
        ),
        "Simple | Time Start late at night, reservation ends at midnight": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=22),
                minimum_duration_minutes=120,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=15, hour=22),
            ),
        ),
        "Simple | Time Start is at midnight on time spans second day": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(day=16),
                time_start=datetime.time(hour=0),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=16, hour=0),
            ),
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__filters__simple(graphql, reservation_unit, filters, result):
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
    # 1st Jan 12:00 - 13:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=1, hour=12),
        end_datetime=_datetime(day=1, hour=13),
    )
    # 5th Jan 07:00 - 09:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=5, hour=7),
        end_datetime=_datetime(day=5, hour=9),
    )
    # 10th Jan 16:00 - 20:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=10, hour=16),
        end_datetime=_datetime(day=10, hour=20),
    )
    # 15th Jan 22:00 - 16th Jan 02:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=15, hour=22),
        end_datetime=_datetime(day=16, hour=2),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert frt(response) == result.first_reservable_datetime
    assert is_closed(response) is result.is_closed


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "Same day timespans | Time Start is after first time span": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=14),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(hour=16),
            ),
        ),
        "Same day timespans | Time start in the middle of first time span": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=11),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(hour=11),
            ),
        ),
        "Same day timespans | Time start in the middle of first time span, minimum duration": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=11),
                minimum_duration_minutes=120,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(hour=16),
            ),
        ),
        "Same day timespans | Time start in first time span, ends in last last, minimum duration": ReservableParams(
            filters=ReservableFilters(
                time_start=datetime.time(hour=11),
                time_end=datetime.time(hour=17),
                minimum_duration_minutes=120,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=None,
            ),
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__filters__multiple_time_spans_on_the_same_day(
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
    # 1st Jan 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )
    # 1st Jan 16:00 - 20:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=16),
        end_datetime=_datetime(hour=20),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert frt(response) == result.first_reservable_datetime
    assert is_closed(response) is result.is_closed


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "Multi-day | Time on the first day": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(day=1),
                time_start=datetime.time(hour=14),
                time_end=datetime.time(hour=16),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=1, hour=14),
            ),
        ),
        "Multi-day | Time on the second day": ReservableParams(
            filters=ReservableFilters(
                date_start=_date(day=2),
                time_start=datetime.time(hour=14),
                time_end=datetime.time(hour=16),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=2, hour=14),
            ),
        ),
        "Multi-day | Time End filter causes midnight of second day to be returned": ReservableParams(
            filters=ReservableFilters(
                time_end=datetime.time(hour=12, minute=59),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=2, hour=0),
            ),
        ),
        "Multi-day | Minimum duration is 25 hours": ReservableParams(
            filters=ReservableFilters(
                minimum_duration_minutes=60 * 25,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=1, hour=13),
            ),
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__filters__multiple_days_long_time_span(
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
    # 1st Jan 13:00 - 5th Jan 13:00 (4 days)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=1, hour=13),
        end_datetime=_datetime(day=5, hour=13),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert frt(response) == result.first_reservable_datetime
    assert is_closed(response) is result.is_closed


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "ReservationUnit Settings | reservation_begins_at": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservation_begins_at=_datetime(day=20, hour=17),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=17),
            ),
        ),
        "ReservationUnit Settings | reservation_begins in the middle of time span": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservation_begins_at=_datetime(day=20, hour=18, minute=1),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=18, minute=15),
            ),
        ),
        "ReservationUnit Settings | reservation_ends causes no results": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservation_ends_at=_datetime(day=11),
            ),
            result=ReservableNode(
                is_closed=True,
                first_reservable_datetime=None,
            ),
        ),
        "ReservationUnit Settings | publish_ends causes no results": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                publish_ends_at=_datetime(day=11, hour=13),
            ),
            result=ReservableNode(
                is_closed=True,
                first_reservable_datetime=None,
            ),
        ),
        "ReservationUnit Settings | reservations_min_days_before": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservations_min_days_before=19,  # Blocks Jan 1st to 19th
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=17),
            ),
        ),
        "ReservationUnit Settings | reservations_min_days_before uses beginning of the day": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservations_min_days_before=20,  # Blocks Jan 1st to 20th
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=21, hour=0),
            ),
        ),
        "ReservationUnit Settings | reservations_max_days_before": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservations_max_days_before=12,  # Blocks days from Jan 13th onwards
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=12, hour=13),
            ),
        ),
        "ReservationUnit Settings | reservations_max_days_before uses beginning of the day": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservations_max_days_before=11,  # Blocks days from Jan 12th onwards
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=None,
            ),
        ),
        "ReservationUnit Settings | min_reservation_duration": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                min_reservation_duration=datetime.timedelta(hours=2),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=17),
            ),
        ),
        "ReservationUnit Settings | max_reservation_duration": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                max_reservation_duration=datetime.timedelta(hours=2),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=12, hour=13),
            ),
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservation_unit_settings(
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

    # 12th Jan 13:00 - 14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=12, hour=13),
        end_datetime=_datetime(day=12, hour=14),
    )
    # 20 Jan 17:00 - 21st Jan 21:00 (1d 4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=20, hour=17),
        end_datetime=_datetime(day=21, hour=21),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert frt(response) == result.first_reservable_datetime
    assert is_closed(response) is result.is_closed


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "Advanced | Min duration is longer than Max duration allowed by reservation unit": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                max_reservation_duration=datetime.timedelta(
                    minutes=120,
                ),
            ),
            filters=ReservableFilters(
                minimum_duration_minutes=121,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=None,
            ),
        ),
        "Advanced | Greater minimum durations is used > min_reservation_duration": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                min_reservation_duration=datetime.timedelta(minutes=61),
            ),
            filters=ReservableFilters(
                minimum_duration_minutes=60,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=17),
            ),
        ),
        "Advanced | Greater minimum durations is used > reservable_minimum_duration_minutes": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                min_reservation_duration=datetime.timedelta(minutes=60),
            ),
            filters=ReservableFilters(
                minimum_duration_minutes=61,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=17),
            ),
        ),
        "Advanced | Next interval is a non-default value": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
            ),
            filters=ReservableFilters(
                time_start=datetime.time(hour=13, minute=1),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=12, hour=13, minute=30),
            ),
        ),
        "Advanced | Next interval doesn't leave enough duration for the minimum duration": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservation_start_interval=ReservationStartInterval.INTERVAL_30_MINUTES.value,
            ),
            filters=ReservableFilters(
                time_start=datetime.time(hour=13, minute=1),
                minimum_duration_minutes=31,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=17),
            ),
        ),
        "Advanced | Next interval is at the end of the time span": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservation_start_interval=ReservationStartInterval.INTERVAL_60_MINUTES.value,
            ),
            filters=ReservableFilters(
                time_start=datetime.time(hour=13, minute=1),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=17),
            ),
        ),
        "Advanced | Next interval is outside time span": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                reservation_start_interval=ReservationStartInterval.INTERVAL_90_MINUTES.value,
            ),
            filters=ReservableFilters(
                time_start=datetime.time(hour=13, minute=1),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=20, hour=17),
            ),
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__filters_and_reservation_unit_settings_combined(
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

    # 12th Jan 13:00 - 14:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=12, hour=13),
        end_datetime=_datetime(day=12, hour=14),
    )
    # 20th Jan 17:00 - 21:00 (4h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=20, hour=17),
        end_datetime=_datetime(day=20, hour=21),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert frt(response) == result.first_reservable_datetime
    assert is_closed(response) is result.is_closed


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "ApplicationRound | Period overlaps, Status=OPEN, ReservationUnit not part of round": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.OPEN,
                reservation_period_begin_date=_date(day=6),
                reservation_period_end_date=_date(day=20),
                reservation_units=[],
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=15, hour=12),
            ),
        ),
        "ApplicationRound | Period overlaps, STATUS=UPCOMING": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.UPCOMING,
                reservation_period_begin_date=_date(day=6),
                reservation_period_end_date=_date(day=20),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=True,
                first_reservable_datetime=None,
            ),
        ),
        "ApplicationRound | Period overlaps, Status=OPEN": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.OPEN,
                reservation_period_begin_date=_date(day=6),
                reservation_period_end_date=_date(day=20),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=True,
                first_reservable_datetime=None,
            ),
        ),
        "ApplicationRound | Period overlaps, Status=IN_ALLOCATION": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.IN_ALLOCATION,
                reservation_period_begin_date=_date(day=1),
                reservation_period_end_date=_date(day=20),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=True,
                first_reservable_datetime=None,
            ),
        ),
        "ApplicationRound | Period overlaps, Status=HANDLED": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.HANDLED,
                reservation_period_begin_date=_date(day=1),
                reservation_period_end_date=_date(day=20),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=True,
                first_reservable_datetime=None,
            ),
        ),
        "ApplicationRound | Period overlaps, Status=RESULTS_SENT": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.RESULTS_SENT,
                reservation_period_begin_date=_date(day=1),
                reservation_period_end_date=_date(day=20),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=15, hour=12),
            ),
        ),
        "ApplicationRound | Not overlapping, Period in the past, Status=UPCOMING": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.UPCOMING,
                reservation_period_begin_date=_date(day=6),
                reservation_period_end_date=_date(day=10),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=15, hour=12),
            ),
        ),
        "ApplicationRound | Not overlapping, Period in the future, Status=OPEN": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.OPEN,
                reservation_period_begin_date=_date(day=20),
                reservation_period_end_date=_date(day=30),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=15, hour=12),
            ),
        ),
        "ApplicationRound | Period partially overlaps, Status=OPEN": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.OPEN,
                reservation_period_begin_date=_date(day=14),
                reservation_period_end_date=_date(day=15),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(day=16, hour=0),
            ),
        ),
        "ApplicationRound | Period partially overlaps, Status=OPEN, Min duration too long": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.OPEN,
                reservation_period_begin_date=_date(day=14),
                reservation_period_end_date=_date(day=15),
            ),
            filters=ReservableFilters(
                minimum_duration_minutes=61,
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=None,
            ),
        ),
        "ApplicationRound | Period ends on the day of time span, STATUS=OPEN": AR_ReservableParams(
            application_round_params=ApplicationStatusParams(
                status=ApplicationRoundStatusChoice.OPEN,
                reservation_period_begin_date=_date(day=14),
                reservation_period_end_date=_date(day=16),
            ),
            filters=ReservableFilters(),
            result=ReservableNode(
                is_closed=True,
                first_reservable_datetime=None,
            ),
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__application_rounds(
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

    ApplicationRoundFactory.create_in_status(**{
        k: v for k, v in asdict(application_round_params).items() if v is not None
    })

    # 15th Jan 12:00 - 16th Jan 01:00 (13h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=15, hour=12),
        end_datetime=_datetime(day=16, hour=1),
    )

    response = graphql(reservation_units_reservable_query(**asdict(filters)))

    assert response.has_errors is False, response
    assert frt(response) == result.first_reservable_datetime
    assert is_closed(response) is result.is_closed


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__filters__application_rounds__start_date_at_round_last_day(
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
        reservation_period_begin_date=_date(day=29),
        reservation_period_end_date=_date(day=30),
    )

    # 29th Jan 11:00 - 12:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=29, hour=11),
        end_datetime=_datetime(day=29, hour=12),
    )
    # 30th Jan 11:00 - 12:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=30, hour=11),
        end_datetime=_datetime(day=30, hour=12),
    )
    # 31st Jan 11:00 - 12:00 (1h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=31, hour=11),
        end_datetime=_datetime(day=31, hour=12),
    )

    response = graphql(
        reservation_units_reservable_query(
            reservable_date_start=_date(month=1, day=30).isoformat(),
            reservable_date_end=_date(month=1, day=31).isoformat(),
        )
    )

    assert response.has_errors is False, response
    assert frt(response) == dt(day=31, hour=11)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservations__own_reservation_block_reservable_time(
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
    # 1st Jan 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 1st Jan 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert frt(response) is None
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservations__unrelated_reservation_should_not_affect(
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

    # 1st Jan 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 1st Jan 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_2,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert frt(response) == dt(hour=10)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservations__dont_include_cancelled_or_denied_reservations(
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

    # 1st Jan 10:00 - 20:00 (12h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=20),
    )

    # 1st Jan 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=12),
        state=ReservationStateChoice.CANCELLED,
    )
    # 1st Jan 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=12),
        state=ReservationStateChoice.DENIED,
    )

    response = graphql(
        reservation_units_reservable_query(
            reservable_date_start=_date(month=1, day=1).isoformat(),
            reservable_date_end=_date(month=1, day=1).isoformat(),
        )
    )

    assert response.has_errors is False, response
    assert frt(response) == dt(hour=10)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservations__date_filters_on_same_day_as_reservation(
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
    │ 1 ░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁██████████▁▁▁▁▁▁░░░░░░░░ │
    └────────────────────────────────────────────────────┘
    """
    # 1st Jan 08:00 - 20:00 (12h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=8),
        end_datetime=_datetime(hour=20),
    )

    # 1st Jan 12:00 - 17:00 (5h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=12),
        ends_at=_datetime(hour=17),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(
        reservation_units_reservable_query(
            reservable_date_start=_date(month=1, day=1).isoformat(),
            reservable_date_end=_date(month=1, day=1).isoformat(),
            reservable_time_start="12:00:00",
            reservable_time_end="17:00:00",
        )
    )

    assert response.has_errors is False, response
    assert frt(response) is None
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservations__filter_start_time_at_reservation_start(
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

    # 1st Jan 08:00 - 20:30 (12h 30min)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=8),
        end_datetime=_datetime(hour=20, minute=30),
    )

    # 1st Jan 14:00 - 15:30 (1h 30min)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=14),
        ends_at=_datetime(hour=15, minute=30),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(
        reservation_units_reservable_query(
            reservable_time_start="14:00:00",
            reservable_time_end="18:00:00",
            reservable_minimum_duration_minutes=60,
        ),
    )

    assert response.has_errors is False, response
    assert frt(response) == dt(hour=15, minute=30)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservations__in_common_hierarchy__by_space(
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

    # 1st Jan 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 1st Jan 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_2,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response

    assert response.node(0)["pk"] == reservation_unit.pk
    assert frt(response, node=0) is None
    assert is_closed(response, node=0) is False

    assert response.node(1)["pk"] == reservation_unit_2.pk
    assert frt(response, node=1) is None
    assert is_closed(response, node=1) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservations__in_common_hierarchy__by_resource(
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

    # 1st Jan 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 1st Jan 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_2,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response

    assert response.node(0)["pk"] == reservation_unit.pk
    assert frt(response, node=0) is None
    assert is_closed(response, node=0) is False

    assert response.node(1)["pk"] == reservation_unit_2.pk
    assert frt(response, node=1) is None
    assert is_closed(response, node=1) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__reservations__in_common_hierarchy__by_resource__and_filters(
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

    # 1st Jan 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    # 1st Jan 10:00 - 12:00 (2h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_2,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response

    assert response.node(0)["pk"] == reservation_unit.pk
    assert frt(response, node=0) is None
    assert is_closed(response, node=0) is False

    assert response.node(1)["pk"] == reservation_unit_2.pk
    assert frt(response, node=1) is None
    assert is_closed(response, node=1) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__buffers__goes_over_closed_time(graphql, reservation_unit):
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
    reservation_unit.buffer_time_before = datetime.timedelta(minutes=60)
    reservation_unit.buffer_time_after = datetime.timedelta(minutes=60)
    reservation_unit.min_reservation_duration = datetime.timedelta(minutes=30)
    reservation_unit.save()

    # 1st Jan 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert frt(response) == dt(hour=10)
    assert is_closed(response) is False


########################################################################################################################


@pytest.mark.parametrize(
    **parametrize_helper({
        "Buffers | Different length buffers are overlapping": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                buffer_time_before=datetime.timedelta(minutes=60),
                buffer_time_after=datetime.timedelta(minutes=60),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(hour=16, minute=30),
            ),
        ),
        "Buffers | Asymmetric different length buffers are overlapping": RU_ReservableParams(
            reservation_unit_settings=ReservationUnitOverrides(
                buffer_time_before=datetime.timedelta(),
                buffer_time_after=datetime.timedelta(minutes=60),
            ),
            result=ReservableNode(
                is_closed=False,
                first_reservable_datetime=dt(hour=16),
            ),
        ),
    })
)
@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__buffers__different_length_buffers_are_overlapping(
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
    reservation_unit.buffer_time_before = datetime.timedelta(minutes=30)
    reservation_unit.buffer_time_after = datetime.timedelta(minutes=30)
    reservation_unit.save()

    reservation_unit_60: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    apply_reservation_unit_override_settings(reservation_unit_60, reservation_unit_settings)

    # 1st Jan 10:00 - 20:00 (10h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=20),
    )

    # 1st Jan 10:00 - 11:30 (1h 30min) | Buffer: 9:30-10:00 + 11:30-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=11, minute=30),
    )
    # 1st Jan 13:00 - 15:30 (1h 30min) | Buffer: (?) + 15:30-16:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=13),
        ends_at=_datetime(hour=15, minute=30),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response

    assert response.node(0)["pk"] == reservation_unit.pk
    assert frt(response, node=0) == dt(hour=12)
    assert is_closed(response, node=0) is False

    assert response.node(1)["pk"] == reservation_unit_60.pk
    assert frt(response, node=1) == result.first_reservable_datetime
    assert is_closed(response, node=1) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__buffers__start_and_end_same_time_different_after_buffers(
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
    reservation_unit_30.buffer_time_before = datetime.timedelta()
    reservation_unit_30.buffer_time_after = datetime.timedelta(minutes=30)
    reservation_unit_30.save()

    reservation_unit_60: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_60.name = "ReservationUnit 60 min buffer"
    reservation_unit_60.buffer_time_before = datetime.timedelta()
    reservation_unit_60.buffer_time_after = datetime.timedelta(minutes=60)
    reservation_unit_60.save()

    # 1st Jan 10:00 - 20:00 (10h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=20),
    )

    # 1st Jan 10:00 - 11:30 (1h 30min) | Buffer: 11:30-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_30,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=11, minute=30),
    )
    # 1st Jan 10:00 - 11:30 (1h 30min) | Buffer: 11:30-12:30
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_60,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=11, minute=30),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response

    assert response.node(0)["pk"] == reservation_unit.pk
    assert frt(response, node=0) == dt(hour=12, minute=30)
    assert is_closed(response, node=0) is False

    assert response.node(1)["pk"] == reservation_unit_30.pk
    assert frt(response, node=1) == dt(hour=12)
    assert is_closed(response, node=1) is False

    assert response.node(2)["pk"] == reservation_unit_60.pk
    assert frt(response, node=2) == dt(hour=12, minute=30)
    assert is_closed(response, node=2) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__buffers__different_before_buffers__before_reservation(
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
    reservation_unit_30.buffer_time_before = datetime.timedelta(minutes=30)
    reservation_unit_30.buffer_time_after = datetime.timedelta()
    reservation_unit_30.save()

    reservation_unit_60: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_60.name = "ReservationUnit 60 min buffer"
    reservation_unit_60.buffer_time_before = datetime.timedelta(minutes=60)
    reservation_unit_60.buffer_time_after = datetime.timedelta()
    reservation_unit_60.save()

    # 1st Jan 10:00 - 20:00 (10h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=20),
    )

    # 1st Jan 10:00 - 10:30 (30min)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=10),
        ends_at=_datetime(hour=10, minute=30),
    )
    # 1st Jan 12:00 - 13:00 (1h) | Buffer: 11:30-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_30,
        begins_at=_datetime(hour=12),
        ends_at=_datetime(hour=13),
    )
    # 1st Jan 12:00 - 13:00 (1h) | Buffer: 11:00-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_60,
        begins_at=_datetime(hour=12),
        ends_at=_datetime(hour=13),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response

    assert response.node(0)["pk"] == reservation_unit.pk
    assert frt(response, node=0) == dt(hour=10, minute=30)
    assert is_closed(response, node=0) is False

    assert response.node(1)["pk"] == reservation_unit_30.pk
    assert frt(response, node=1) == dt(hour=11)
    assert is_closed(response, node=1) is False

    assert response.node(2)["pk"] == reservation_unit_60.pk
    assert frt(response, node=2) == dt(hour=14)
    assert is_closed(response, node=2) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__buffers__different_before_buffers__before_closed_time(
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
    reservation_unit_30.buffer_time_before = datetime.timedelta(minutes=30)
    reservation_unit_30.buffer_time_after = datetime.timedelta()
    reservation_unit_30.save()

    reservation_unit_60: ReservationUnit = create_child_for_reservation_unit(reservation_unit)
    reservation_unit_60.name = "ReservationUnit 60 min buffer"
    reservation_unit_60.buffer_time_before = datetime.timedelta(minutes=60)
    reservation_unit_60.buffer_time_after = datetime.timedelta()
    reservation_unit_60.save()

    # 1st Jan 10:30-20:00 (9h 30min)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10, minute=30),
        end_datetime=_datetime(hour=20),
    )

    # 1st Jan 12:00-13:00 (1h) | Buffer: 11:30-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_30,
        begins_at=_datetime(hour=12),
        ends_at=_datetime(hour=13),
    )

    # 1st Jan 12:00-13:00 (1h) | Buffer: 11:00-12:00
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit_60,
        begins_at=_datetime(hour=12),
        ends_at=_datetime(hour=13),
    )

    response = graphql(reservation_units_reservable_query(fields="pk isClosed firstReservableDatetime"))

    assert response.has_errors is False, response

    assert response.node(0)["pk"] == reservation_unit.pk
    assert frt(response, node=0) == dt(hour=10, minute=30)
    assert is_closed(response, node=0) is False

    assert response.node(1)["pk"] == reservation_unit_30.pk
    assert frt(response, node=1) == dt(hour=10, minute=30)
    assert is_closed(response, node=1) is False

    assert response.node(2)["pk"] == reservation_unit_60.pk
    assert frt(response, node=2) == dt(hour=10, minute=30)
    assert is_closed(response, node=2) is False


########################################################################################################################


@freezegun.freeze_time(datetime.datetime(NEXT_YEAR, 1, 1, 10, microsecond=1).astimezone(DEFAULT_TIMEZONE))
def test__reservation_unit__first_reservable_time__round_current_time_to_the_next_minute(graphql, reservation_unit):
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
    # 1st Jan 10:00 - 12:00 (2h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    response = graphql(reservation_units_reservable_query())

    assert response.has_errors is False, response
    assert frt(response) == dt(hour=10, minute=15)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__extra_long_interval(graphql, reservation_unit):
    """
    Make sure that:
    - The correct first reservable time is returned even with a long interval
    - When the reservable time span is split in two, the intervals for the reservable time is correctly calculated from
      the beginning of the original ReservableTimeSpan, not from the new split time span or beginning of the day.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    │ ═ = Valid reservation times due to interval        │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit                                   │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░▁▁▁▁▁▁▁▁██████▁▁▁▁▁▁░░░░░░░░░░ │
    │                     ══  ══  ══  ══  ══             │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit.min_reservation_duration = datetime.timedelta(minutes=60)
    reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_120_MINUTES.value
    reservation_unit.save()

    # 1st Jan 9:00 - 19:00 (8h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=9),
        end_datetime=_datetime(hour=19),
    )

    # 1st Jan 13:00 - 16:00 (3h)
    ReservationFactory.create_for_reservation_unit(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=13),
        ends_at=_datetime(hour=16),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    # Query without any filters.
    # The first reservable time should be the beginning of the Reservable Time Span
    response = graphql(reservation_units_reservable_query())
    assert response.has_errors is False, response
    assert frt(response) == dt(hour=9)
    assert is_closed(response) is False

    # Query one minute after beginning of the Reservable Time Span
    # The next interval is at 11:00.
    response = graphql(reservation_units_reservable_query(reservable_time_start="09:01"))
    assert response.has_errors is False, response
    assert frt(response) == dt(hour=11)
    assert is_closed(response) is False

    # Query one minute after the last interval
    # Next interval are at 13:00 and 15:00, but the reservation ends at 16:00, so the next valid time is at 17:00
    response = graphql(reservation_units_reservable_query(reservable_time_start="11:01"))
    assert response.has_errors is False, response
    assert frt(response) == dt(hour=17)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__blocked_type_reservation_can_overlap_with_buffer(
    graphql, reservation_unit
):
    """
    Make sure that:
    - Buffers from new reservations can overlap with the BLOCKED-Type Reservation
    - BLOCKED-Type Reservation buffers are ignored even if they are set
    - BLOCKED-Type Reservations still block new reservations that overlap with them

    ┌────────────────────────────────────────────────────┐
    │ █ = BLOCKED-Type Reservation                       │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    │ ═ = First reservable time                          │
    │ ─ = Reservation Unit Buffer                        │
    ├────────────────────────────────────────────────────┤
    │ reservation_unit                                   │
    │   0   2   4   6   8   10  12  14  16  18  20  22   │
    │ 1 ░░░░░░░░░░░░░░░░░░░░▁▁▁▁████▁▁▁▁░░░░░░░░░░░░░░░░ │
    │                     ──══──                         │
    │                       ──══──                       │
    │                             ──══──                 │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit.min_reservation_duration = datetime.timedelta(minutes=60)
    reservation_unit.buffer_time_before = datetime.timedelta(minutes=60)
    reservation_unit.buffer_time_after = datetime.timedelta(minutes=60)
    reservation_unit.save()

    # 1st Jan 10:00 - 16:00 (6h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=16),
    )

    # 1st Jan 12:00 - 14:00 (2h)
    ReservationFactory.create(
        reservation_unit=reservation_unit,
        begins_at=_datetime(hour=12),
        ends_at=_datetime(hour=14),
        buffer_time_before=datetime.timedelta(minutes=300),  # This buffer should be completely ignored
        buffer_time_after=datetime.timedelta(minutes=300),  # This buffer should be completely ignored
        type=ReservationTypeChoice.BLOCKED,
        state=ReservationStateChoice.CONFIRMED,
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    # Buffer does not overlap with BLOCKED reservation at all
    response = graphql(reservation_units_reservable_query(reservable_time_start=datetime.time(hour=10).isoformat()))
    assert response.has_errors is False, response
    assert frt(response) == dt(hour=10)
    assert is_closed(response) is False

    # Buffer overlaps with BLOCKED reservation from the end, which should be allowed
    response = graphql(reservation_units_reservable_query(reservable_time_start=datetime.time(hour=11).isoformat()))
    assert response.has_errors is False, response
    assert frt(response) == dt(hour=11)
    assert is_closed(response) is False

    # Buffer overlaps with BLOCKED reservation from the start, which should be allowed
    response = graphql(reservation_units_reservable_query(reservable_time_start=datetime.time(hour=12).isoformat()))
    assert response.has_errors is False, response
    assert frt(response) == dt(hour=14)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(datetime.datetime(2024, 1, 1, hour=8, tzinfo=DEFAULT_TIMEZONE))
def test_reservation_unit__first_reservable_time__duration_exactly_min_but_buffers_overlap(graphql, reservation_unit):
    """
    This is a regression test for a bug that was found during manual testing.

    Tests a case where the algorithm for finding the first reservable time exited too
    early when shortening reservable time spans based on reservations.

    This happened when the reservable time duration was exactly the minimum duration after
    processing a reservation, which caused the shortening to stop, but subsequent checks would
    still determine the reservable time span to be _just_ long enough to fit the minimum duration.

    In reality, the shortening should have continued until the reservable time was
    _actually_ shorter than the minimum duration, since there could be a reservation
    that could shorten it still, like in this example case.

    ┌────────────────────────────────────────────────────┐
    │ █ = Reservation                                    │
    │ ▄ = Reservation Buffer                             │
    │ ░ = Not reservable                                 │
    │ ▁ = Reservable                                     │
    │ ═ = First reservable time                          │
    │ ─ = Reservation Unit Buffer                        │
    ├────────────────────────────────────────────────────┤
    │   ...       17  18  19  20  21  22             ... │
    │ 1 ░░░░░░░░░░████▁▁████▁▄████▄▄▁▁░░░░░░░░░░░░░░░░░░ │
    │                              ─═─                   │
    └────────────────────────────────────────────────────┘
    """
    reservation_unit.reservation_start_interval = ReservationStartInterval.INTERVAL_15_MINUTES.value
    reservation_unit.buffer_time_before = datetime.timedelta(minutes=15)
    reservation_unit.buffer_time_after = datetime.timedelta(minutes=15)
    reservation_unit.save()

    # 1st Jan 17:00 - 22:00 (5h)
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=17),
        end_datetime=_datetime(hour=22),
    )

    # 1st Jan 17:00-18:00 (1h) | Buffer: none
    ReservationFactory.create(
        begins_at=_datetime(hour=17),
        ends_at=_datetime(hour=18),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CREATED,
    )

    # 1st Jan 18:30-19:30 (1h) | Buffer: none
    ReservationFactory.create(
        begins_at=_datetime(hour=18, minute=30),
        ends_at=_datetime(hour=19, minute=30),
        buffer_time_before=datetime.timedelta(),
        buffer_time_after=datetime.timedelta(),
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CREATED,
    )

    # 1st Jan 20:00-21:00 (1h) | Buffer: 19:45-21:30
    ReservationFactory.create(
        begins_at=_datetime(hour=20),
        ends_at=_datetime(hour=21),
        buffer_time_before=datetime.timedelta(minutes=15),
        buffer_time_after=datetime.timedelta(minutes=30),
        reservation_unit=reservation_unit,
        state=ReservationStateChoice.CREATED,
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    response = graphql(reservation_units_reservable_query())
    assert response.has_errors is False, response
    assert is_closed(response) is False
    assert frt(response) == dt(hour=21, minute=30)


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__no_bug_in_pagination_from_hauki_resource(graphql, reservation_unit):
    """
    This is a regression test for a bug that was found during manual testing.

    Tests that when pagination optimization occurs when calculating first reservable time (FRT),
    reservation units with no HaukiResource do not affect the results of the calculation.

    Previously, errors would occur when the previous page had reservation units with no HaukiResource.
    The FRT calculation would not include these reservation units when calculating, meaning it would
    start from the wrong reservation unit, which would throw off the page size calculation.

    In this test, we have 1 reservation unit with a HaukiResource, and 1 without one.
    With the given ordering, the one with no HaukiResource is "in the previous page", since we use an offset of 1.
    But during the FRT calculation, given the previous bug, the offset would have been applied on top of removing
    all reservation units with no HaukiResource from the query, meaning we start calculating FRTs from an imaginary
    3rd reservation unit. This means that we never calculate the FRT for the 2nd reservation unit, meaning
    it would be None. The tests asserts that this should not happen.
    """
    common_space = SpaceFactory.create()

    ReservationUnitFactory(name="A", spaces=[common_space], unit=reservation_unit.unit)

    reservation_unit.name = "B"
    reservation_unit.spaces.set([common_space])
    reservation_unit.save()

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    query = reservation_units_reservable_query(order_by="nameFiAsc", offset=1)
    response = graphql(query)
    assert response.has_errors is False, response

    assert len(response) == 1
    assert frt(response) == dt(hour=10)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__remove_not_reservable(graphql, reservation_unit):
    """
    Check that when 'show_only_reservable' is True, non-reservable reservation units are removed and handled
    correctly with page size. Also check that the correct number of queries are made.
    """
    common_space = SpaceFactory.create()

    ReservationUnitFactory(name="A", spaces=[common_space], unit=reservation_unit.unit)

    reservation_unit.name = "B"
    reservation_unit.spaces.set([common_space])
    reservation_unit.save()

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    query = reservation_units_reservable_query(order_by="nameFiAsc", show_only_reservable=True, first=1)
    response = graphql(query)
    assert response.has_errors is False, response

    assert len(response) == 1
    assert frt(response) == dt(hour=10)
    assert is_closed(response) is False


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__previous_page_cached(graphql, reservation_unit):
    """Checks that the page results are cached so that pagination works correctly."""
    common_space = SpaceFactory.create()

    reservation_unit_2 = ReservationUnitFactory(name="A", spaces=[common_space], unit=reservation_unit.unit)

    reservation_unit.name = "B"
    reservation_unit.spaces.set([common_space])
    reservation_unit.save()

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    # See "ReservationUnitFilterSet.get_filter_reservable" on how this is calculated
    cache_key = "Y2FsY3VsYXRlX2ZpcnN0X3Jlc2VydmFibGVfdGltZT1UcnVlLG9yZGVyX2J5PVsnbmFtZV9maSdd"

    query_1 = reservation_units_reservable_query(order_by="nameFiAsc", first=1)
    response_1 = graphql(query_1)
    assert response_1.has_errors is False, response_1

    assert len(response_1) == 1
    assert frt(response_1) is None
    assert is_closed(response_1) is True

    # Check cache contents.
    cached_value: dict[str, dict[str, Any]] = json.loads(cache.get(cache_key))
    assert len(cached_value) == 1
    assert cached_value[str(reservation_unit_2.pk)]["frt"] == "None"
    assert cached_value[str(reservation_unit_2.pk)]["closed"] == "True"

    query_2 = reservation_units_reservable_query(order_by="nameFiAsc", first=1, offset=1)
    response_2 = graphql(query_2)
    assert response_2.has_errors is False, response_2

    assert len(response_2) == 1
    assert frt(response_2) == dt(hour=10)
    assert is_closed(response_2) is False

    # Check cache contents has been updated.
    cached_value: dict[str, dict[str, Any]] = json.loads(cache.get(cache_key))
    assert len(cached_value) == 2
    assert cached_value[str(reservation_unit_2.pk)]["frt"] == "None"
    assert cached_value[str(reservation_unit_2.pk)]["closed"] == "True"
    assert cached_value[str(reservation_unit.pk)]["frt"] == dt(hour=10)
    assert cached_value[str(reservation_unit.pk)]["closed"] == "False"

    # Check that there was no additional queries
    response_2.assert_query_count(9)
    # ...and that we were able to skip iterating through the previous pages due to cached results.
    assert "OFFSET 1" in response_2.queries[1]


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__previous_page_not_cached(graphql, reservation_unit):
    """
    Check that when we query the second page first, we calculate the first page's results so that
    pagination to work correctly for the second page.
    """
    common_space = SpaceFactory.create()

    reservation_unit_2 = ReservationUnitFactory(name="A", spaces=[common_space], unit=reservation_unit.unit)

    reservation_unit.name = "B"
    reservation_unit.spaces.set([common_space])
    reservation_unit.save()

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    # See "ReservationUnitFilterSet.get_filter_reservable" on how this is calculated
    cache_key = "Y2FsY3VsYXRlX2ZpcnN0X3Jlc2VydmFibGVfdGltZT1UcnVlLG9yZGVyX2J5PVsnbmFtZV9maSdd"

    query = reservation_units_reservable_query(order_by="nameFiAsc", first=1, offset=1)
    response = graphql(query)
    assert response.has_errors is False, response

    assert len(response) == 1
    assert frt(response) == dt(hour=10)
    assert is_closed(response) is False

    # Check cache contents has been updated.
    cached_value: dict[str, dict[str, Any]] = json.loads(cache.get(cache_key))
    assert len(cached_value) == 2
    assert cached_value[str(reservation_unit_2.pk)]["frt"] == "None"
    assert cached_value[str(reservation_unit_2.pk)]["closed"] == "True"
    assert cached_value[str(reservation_unit.pk)]["frt"] == dt(hour=10)
    assert cached_value[str(reservation_unit.pk)]["closed"] == "False"

    # Check that there was no additional queries
    response.assert_query_count(9)
    # We also cannot skip previous pages due to missing cached results.
    assert "OFFSET 1" not in response.queries[1]


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__different_filters_dont_share_cache(graphql, reservation_unit):
    """Checks that cached results based on different filters are not shared."""
    common_space = SpaceFactory.create()

    ReservationUnitFactory(name="A", spaces=[common_space], unit=reservation_unit.unit)

    reservation_unit.name = "B"
    reservation_unit.spaces.set([common_space])
    reservation_unit.save()

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    query_1 = reservation_units_reservable_query(order_by="nameFiAsc", first=1)
    response_1 = graphql(query_1)
    assert response_1.has_errors is False, response_1

    assert len(response_1) == 1
    assert frt(response_1) is None
    assert is_closed(response_1) is True

    # See "ReservationUnitFilterSet.get_filter_reservable" on how this is calculated
    cache_key_1 = "Y2FsY3VsYXRlX2ZpcnN0X3Jlc2VydmFibGVfdGltZT1UcnVlLG9yZGVyX2J5PVsnbmFtZV9maSdd"

    # Check that we did cache the first page's results.
    cached_value: dict[str, dict[str, Any]] = json.loads(cache.get(cache_key_1))
    assert len(cached_value) == 1

    # Use a different query. Note: even ordering affects results.
    query_2 = reservation_units_reservable_query(order_by="nameFiDesc", first=1)
    response_2 = graphql(query_2)
    assert response_2.has_errors is False, response_2

    assert len(response_2) == 1
    assert frt(response_2) == dt(hour=10)
    assert is_closed(response_2) is False

    cache_key_2 = "Y2FsY3VsYXRlX2ZpcnN0X3Jlc2VydmFibGVfdGltZT1UcnVlLG9yZGVyX2J5PVsnLW5hbWVfZmknXQ=="

    # Check that we have a new cached value for the second filter's results.
    cached_value: dict[str, dict[str, Any]] = json.loads(cache.get(cache_key_2))
    assert len(cached_value) == 1
    # Cache for the previous request is still there.
    cached_value: dict[str, dict[str, Any]] = json.loads(cache.get(cache_key_1))
    assert len(cached_value) == 1

    # We couldn't use the cached results, so make database queries as usual.
    response_2.assert_query_count(9)


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__use_cached_results(graphql, reservation_unit):
    """Check that when we query the same page twice, we use the cached results on the second query."""
    common_space = SpaceFactory.create()

    ReservationUnitFactory(name="A", spaces=[common_space], unit=reservation_unit.unit)

    reservation_unit.name = "B"
    reservation_unit.spaces.set([common_space])
    reservation_unit.save()

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    query_1 = reservation_units_reservable_query(order_by="nameFiAsc", first=1)
    response_1 = graphql(query_1)
    assert response_1.has_errors is False, response_1

    assert len(response_1) == 1
    assert frt(response_1) is None
    assert is_closed(response_1) is True

    # See "ReservationUnitFilterSet.get_filter_reservable" on how this is calculated
    cache_key_1 = "Y2FsY3VsYXRlX2ZpcnN0X3Jlc2VydmFibGVfdGltZT1UcnVlLG9yZGVyX2J5PVsnbmFtZV9maSdd"
    # Check tha results were cached.
    cached_value: dict[str, dict[str, Any]] = json.loads(cache.get(cache_key_1))
    assert len(cached_value) == 1

    query_2 = reservation_units_reservable_query(order_by="nameFiAsc", first=1)
    response_2 = graphql(query_2)
    assert response_2.has_errors is False, response_2

    assert len(response_2) == 1
    assert frt(response_2) is None
    assert is_closed(response_2) is True

    # Since we used cached results, we didn't need to make database queries.
    # Only make queries for:
    #  1) Count reservation units for FRT calculation
    #  2) Count reservation units for response
    #  3) Fetch reservation units for response
    response_2.assert_query_count(3)


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__use_cached_results__not_first_page(graphql, reservation_unit):
    """
    Check that cached results are used for pages other than the first page if they exist
    for both the first AND the second page.
    """
    common_space = SpaceFactory.create()

    ReservationUnitFactory(name="A", spaces=[common_space], unit=reservation_unit.unit)

    reservation_unit.name = "B"
    reservation_unit.spaces.set([common_space])
    reservation_unit.save()

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=10),
        end_datetime=_datetime(hour=12),
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    query_1 = reservation_units_reservable_query(order_by="nameFiAsc", first=1)
    response_1 = graphql(query_1)
    assert response_1.has_errors is False, response_1

    assert len(response_1) == 1
    assert frt(response_1) is None
    assert is_closed(response_1) is True

    query_2 = reservation_units_reservable_query(order_by="nameFiAsc", first=1, offset=1)
    response_2 = graphql(query_2)
    assert response_2.has_errors is False, response_2

    assert len(response_2) == 1
    assert frt(response_2) == dt(hour=10)
    assert is_closed(response_2) is False

    query_3 = reservation_units_reservable_query(order_by="nameFiAsc", first=1, offset=1)
    response_3 = graphql(query_3)
    assert response_3.has_errors is False, response_3

    assert len(response_3) == 1
    assert frt(response_3) == dt(hour=10)
    assert is_closed(response_3) is False

    # Since we used cached results, we didn't need to make database queries.
    # Only make queries for:
    #  1) Count reservation units for FRT calculation
    #  2) Count reservation units for response
    #  3) Fetch reservation units for response
    response_3.assert_query_count(3)


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__cached_results_not_valid_anymore(graphql, reservation_unit):
    """
    Check that we correctly identify that one of the cached results is not valid anymore.
    This triggers a re-calculation for all results up to the current page, since the results
    might have changed in previous pages too.
    """
    common_space = SpaceFactory.create()

    reservation_unit_2 = ReservationUnitFactory(name="A", spaces=[common_space], unit=reservation_unit.unit)

    reservation_unit.name = "B"
    reservation_unit.spaces.set([common_space])
    reservation_unit.save()

    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(hour=13),
        end_datetime=_datetime(hour=14),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=NOW,
    )

    ReservationUnitHierarchy.refresh()
    AffectingTimeSpan.refresh()

    # Set the cached results manually. Note that one of the results is not valid anymore!
    cached_results = {
        # First page
        str(reservation_unit_2): CachedReservableTime(
            frt=None,
            closed=True,
            access_type=None,
            valid_until=local_datetime() - datetime.timedelta(minutes=1),  # invalid
        ).to_dict(),
        # Second page
        str(reservation_unit): CachedReservableTime(
            frt=datetime.datetime.fromisoformat("2025-01-01T10:00:00+02:00"),  # re-calculation will correct this value
            closed=False,
            access_type=None,  # re-calculation will correct this value
            valid_until=local_datetime() + datetime.timedelta(minutes=1),  # valid
        ).to_dict(),
    }
    cache_key = "Y2FsY3VsYXRlX2ZpcnN0X3Jlc2VydmFibGVfdGltZT1UcnVlLG9yZGVyX2J5PVsnbmFtZV9maSdd"
    cache.set(cache_key, json.dumps(cached_results), timeout=120)

    # Query the second page
    query = reservation_units_reservable_query_access_type(order_by="nameFiAsc", first=1, offset=1)
    response = graphql(query)
    assert response.has_errors is False, response

    assert len(response) == 1
    assert frt(response) == dt(hour=13)
    assert frt_access_type(response) == AccessType.ACCESS_CODE
    assert is_closed(response) is False
    assert response.node(0)["pk"] == reservation_unit.pk

    # Since we couldn't use all the cached results,
    # we needed to fetch data from the database for re-calculation.
    response.assert_query_count(9)


########################################################################################################################


@freezegun.freeze_time(NOW)
def test__reservation_unit__first_reservable_time__access_type(graphql, reservation_unit):
    ReservableTimeSpanFactory.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_datetime(day=1),
        end_datetime=_datetime(day=18),
    )

    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.ACCESS_CODE,
        begin_date=_date(day=5),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.PHYSICAL_KEY,
        begin_date=_date(day=10),
    )
    ReservationUnitAccessTypeFactory.create(
        reservation_unit=reservation_unit,
        access_type=AccessType.OPENED_BY_STAFF,
        begin_date=_date(day=20),
    )

    # Before any AccessType has begun
    response = graphql(reservation_units_reservable_query_access_type(reservable_date_start=_date(day=1).isoformat()))
    assert response.has_errors is False, response
    assert frt(response) == dt(day=1)
    assert frt_access_type(response) is None

    # Same date as new AccessType begins
    response = graphql(reservation_units_reservable_query_access_type(reservable_date_start=_date(day=5).isoformat()))
    assert response.has_errors is False, response
    assert frt(response) == dt(day=5)
    assert frt_access_type(response) == AccessType.ACCESS_CODE

    # AccessType has changed
    response = graphql(reservation_units_reservable_query_access_type(reservable_date_start=_date(day=15).isoformat()))
    assert response.has_errors is False, response
    assert frt(response) == dt(day=15)
    assert frt_access_type(response) == AccessType.PHYSICAL_KEY

    # Not a reservable time, but use AccessType from the filter date
    response = graphql(reservation_units_reservable_query_access_type(reservable_date_start=_date(day=30).isoformat()))
    assert response.has_errors is False, response
    assert frt(response) is None
    assert frt_access_type(response) == AccessType.OPENED_BY_STAFF
