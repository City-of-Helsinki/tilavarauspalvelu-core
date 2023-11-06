import datetime
from functools import partial
from zoneinfo import ZoneInfo

import pytest
from django.utils.timezone import get_default_timezone

from reservation_units.models import ReservationUnit
from tests.factories import (
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationUnitFactory,
)
from tests.helpers import build_query

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

DEFAULT_TIMEZONE = get_default_timezone()

UTCOFFSET = f"0{int(datetime.datetime(2021, 5, 1, tzinfo=DEFAULT_TIMEZONE).utcoffset().total_seconds()/3600)}:00"


@pytest.fixture()
def reservation_unit() -> ReservationUnit:
    origin_hauki_resource = OriginHaukiResourceFactory(
        id="999",
        opening_hours_hash="test_hash",
        latest_fetched_date="2021-05-03",
    )
    return ReservationUnitFactory(origin_hauki_resource=origin_hauki_resource)


def _get_date(*, day: int = 1, hour: int = 0, tzinfo: ZoneInfo | None = None):
    return datetime.datetime(2023, 5, day, hour, 0, 0, tzinfo=tzinfo or DEFAULT_TIMEZONE)


reservation_unit_time_spans_query = partial(
    build_query,
    "reservationUnitByPk",
    fields='reservableTimeSpans(startDate:"2023-05-01" endDate:"2024-01-01"){startDatetime endDatetime}',
)


def test__gql__reservation_unit__reservable_time_spans__no_origin_hauki_resource(graphql, reservation_unit):
    reservation_unit.origin_hauki_resource = None
    reservation_unit.save()

    response = graphql(reservation_unit_time_spans_query(pk=reservation_unit.id))

    assert response.get("errors") is None
    assert response.data == {
        "reservationUnitByPk": {
            "reservableTimeSpans": None,
        }
    }


def test__gql__reservation_unit__reservable_time_spans__no_start_date(graphql, reservation_unit):
    response = graphql(
        reservation_unit_time_spans_query(
            pk=reservation_unit.id,
            fields='reservableTimeSpans(endDate:"2024-01-01"){startDatetime endDatetime}',
        )
    )

    assert response.get("errors") is None
    assert response.data == {
        "reservationUnitByPk": {
            "reservableTimeSpans": None,
        }
    }


def test__gql__reservation_unit__reservable_time_spans__no_end_date(graphql, reservation_unit):
    response = graphql(
        reservation_unit_time_spans_query(
            pk=reservation_unit.id,
            fields='reservableTimeSpans(startDate:"2023-05-01"){startDatetime endDatetime}',
        )
    )

    assert response.get("errors") is None
    assert response.data == {
        "reservationUnitByPk": {
            "reservableTimeSpans": None,
        }
    }


def test__gql__reservation_unit__reservable_time_spans__no_results(graphql, reservation_unit):
    response = graphql(reservation_unit_time_spans_query(pk=reservation_unit.id))

    assert response.get("errors") is None
    assert response.data == {
        "reservationUnitByPk": {
            "reservableTimeSpans": [],
        }
    }


def test__gql__reservation_unit__reservable_time_spans__multiple_days(graphql, reservation_unit):
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=1, hour=0),
        end_datetime=_get_date(day=1, hour=12),
    )
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=2, hour=10),
        end_datetime=_get_date(day=2, hour=12),
    )
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=3, hour=20),
        end_datetime=_get_date(day=4, hour=0),
    )

    response = graphql(reservation_unit_time_spans_query(pk=reservation_unit.id))

    assert response.get("errors") is None
    assert response.data["reservationUnitByPk"]["reservableTimeSpans"] == [
        {
            "startDatetime": f"2023-05-01T00:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-01T12:00:00+{UTCOFFSET}",
        },
        {
            "startDatetime": f"2023-05-02T10:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-02T12:00:00+{UTCOFFSET}",
        },
        {
            "startDatetime": f"2023-05-03T20:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-04T00:00:00+{UTCOFFSET}",
        },
    ]


def test__gql__reservation_unit__reservable_time_spans__multiple_spans_in_same_day(graphql, reservation_unit):
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=1, hour=10),
        end_datetime=_get_date(day=1, hour=20),
    )
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=2, hour=10),
        end_datetime=_get_date(day=2, hour=12),
    )
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=2, hour=14),
        end_datetime=_get_date(day=2, hour=16),
    )
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=2, hour=18),
        end_datetime=_get_date(day=2, hour=20),
    )

    response = graphql(reservation_unit_time_spans_query(pk=reservation_unit.id))

    assert response.get("errors") is None
    assert response.data["reservationUnitByPk"]["reservableTimeSpans"] == [
        {
            "startDatetime": f"2023-05-01T10:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-01T20:00:00+{UTCOFFSET}",
        },
        {
            "startDatetime": f"2023-05-02T10:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-02T12:00:00+{UTCOFFSET}",
        },
        {
            "startDatetime": f"2023-05-02T14:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-02T16:00:00+{UTCOFFSET}",
        },
        {
            "startDatetime": f"2023-05-02T18:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-02T20:00:00+{UTCOFFSET}",
        },
    ]


def test__gql__reservation_unit__reservable_time_spans__full_day(graphql, reservation_unit):
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=4, hour=0),
        end_datetime=_get_date(day=5, hour=0),
    )

    response = graphql(reservation_unit_time_spans_query(pk=reservation_unit.id))

    assert response.get("errors") is None
    assert response.data["reservationUnitByPk"]["reservableTimeSpans"] == [
        {
            "startDatetime": f"2023-05-04T00:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-05T00:00:00+{UTCOFFSET}",
        },
    ]


def test__gql__reservation_unit__reservable_time_spans__multiple_days_long_time_span(graphql, reservation_unit):
    ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=10, hour=12),
        end_datetime=_get_date(day=12, hour=12),
    )

    response = graphql(reservation_unit_time_spans_query(pk=reservation_unit.id))

    assert response.get("errors") is None
    assert response.data["reservationUnitByPk"]["reservableTimeSpans"] == [
        {
            "startDatetime": f"2023-05-10T12:00:00+{UTCOFFSET}",
            "endDatetime": f"2023-05-12T12:00:00+{UTCOFFSET}",
        },
    ]


def test__gql__reservation_unit__reservable_time_spans__all_timezones_are_in_default_tz(graphql, reservation_unit):
    rts1 = ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=1, hour=10, tzinfo=ZoneInfo("Europe/Helsinki")),
        end_datetime=_get_date(day=1, hour=20, tzinfo=ZoneInfo("Europe/Helsinki")),
    )
    rts2 = ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=2, hour=10, tzinfo=ZoneInfo("America/New_York")),
        end_datetime=_get_date(day=2, hour=20, tzinfo=ZoneInfo("America/New_York")),
    )
    rts3 = ReservableTimeSpanFactory(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=3, hour=10, tzinfo=ZoneInfo("Asia/Shanghai")),
        end_datetime=_get_date(day=3, hour=20, tzinfo=ZoneInfo("Asia/Shanghai")),
    )

    response = graphql(reservation_unit_time_spans_query(pk=reservation_unit.id))

    assert response.get("errors") is None
    assert response.data["reservationUnitByPk"]["reservableTimeSpans"] == [
        {
            "startDatetime": rts1.start_datetime.astimezone(DEFAULT_TIMEZONE).isoformat(),
            "endDatetime": rts1.end_datetime.astimezone(DEFAULT_TIMEZONE).isoformat(),
        },
        {
            "startDatetime": rts2.start_datetime.astimezone(DEFAULT_TIMEZONE).isoformat(),
            "endDatetime": rts2.end_datetime.astimezone(DEFAULT_TIMEZONE).isoformat(),
        },
        {
            "startDatetime": rts3.start_datetime.astimezone(DEFAULT_TIMEZONE).isoformat(),
            "endDatetime": rts3.end_datetime.astimezone(DEFAULT_TIMEZONE).isoformat(),
        },
    ]
