import datetime

import pytest
from django.utils.timezone import get_default_timezone

from opening_hours.utils.summaries import (
    get_resources_total_hours_per_resource,
)
from tests.factories import OriginHaukiResourceFactory, ReservableTimeSpanFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

DEFAULT_TIMEZONE = get_default_timezone()


def test__get_resources_total_hours_per_resource__when_no_resources():
    total_hours_dict = get_resources_total_hours_per_resource(
        [],
        datetime.date(2023, 1, 1),
        datetime.date(2023, 1, 2),
    )
    assert total_hours_dict == {}


def test__get_resources_total_hours_per_resource__when_no_reservable_time_spans():
    ohr1 = OriginHaukiResourceFactory(id=123)
    ohr2 = OriginHaukiResourceFactory(id=321)

    total_hours_dict = get_resources_total_hours_per_resource(
        [ohr1.id, ohr2.id],
        datetime.date(2023, 1, 1),
        datetime.date(2023, 1, 2),
    )
    assert total_hours_dict == {
        ohr1.id: 0,
        ohr2.id: 0,
    }


def test__get_resources_total_hours_per_resource__when_one_resource_has_reservable_time_spans():
    ohr1 = OriginHaukiResourceFactory(id=123)
    ohr2 = OriginHaukiResourceFactory(id=321)
    ReservableTimeSpanFactory(
        resource=ohr1,
        start_datetime=datetime.datetime(2023, 1, 1, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    ReservableTimeSpanFactory(
        resource=ohr1,
        start_datetime=datetime.datetime(2023, 1, 2, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 2, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    total_hours_dict = get_resources_total_hours_per_resource(
        [ohr1.id, ohr2.id],
        datetime.date(2023, 1, 1),
        datetime.date(2023, 1, 2),
    )
    assert total_hours_dict == {
        ohr1.id: 24,
        ohr2.id: 0,
    }


def test__get_resources_total_hours_per_resource__when_multiple_resources_have_reservable_time_spans():
    ohr1 = OriginHaukiResourceFactory(id=123)
    ohr2 = OriginHaukiResourceFactory(id=321)
    # Date in the past, should not be included
    ReservableTimeSpanFactory(
        resource=ohr1,
        start_datetime=datetime.datetime(2022, 12, 31, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2022, 12, 31, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    ReservableTimeSpanFactory(
        resource=ohr1,
        start_datetime=datetime.datetime(2023, 1, 1, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 1, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    ReservableTimeSpanFactory(
        resource=ohr1,
        start_datetime=datetime.datetime(2023, 1, 2, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 2, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    # Date in the future, should not be included
    ReservableTimeSpanFactory(
        resource=ohr1,
        start_datetime=datetime.datetime(2023, 1, 11, 10, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 11, 22, tzinfo=DEFAULT_TIMEZONE),
    )
    ReservableTimeSpanFactory(
        resource=ohr2,
        start_datetime=datetime.datetime(2023, 1, 2, 0, tzinfo=DEFAULT_TIMEZONE),
        end_datetime=datetime.datetime(2023, 1, 2, 22, tzinfo=DEFAULT_TIMEZONE),
    )

    total_hours_dict = get_resources_total_hours_per_resource(
        [ohr1.id, ohr2.id],
        datetime.date(2023, 1, 1),
        datetime.date(2023, 1, 10),
    )
    assert total_hours_dict == {
        ohr1.id: 24,
        ohr2.id: 22,
    }
