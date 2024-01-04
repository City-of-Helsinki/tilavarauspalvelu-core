import datetime
from typing import NamedTuple

import pytest

from opening_hours.models import ReservableTimeSpan
from tests.factories import OriginHaukiResourceFactory, ReservableTimeSpanFactory
from tests.helpers import parametrize_helper

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
    pytest.mark.usefixtures("_disable_elasticsearch"),
]


class OverlapParams(NamedTuple):
    start: datetime.datetime
    end: datetime.datetime
    overlaps: bool


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "starts before period start and ends before period start": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 9, tzinfo=datetime.UTC),
                overlaps=False,
            ),
            "starts before period start and ends at period start": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 10, tzinfo=datetime.UTC),
                overlaps=False,
            ),
            "starts before period start and ends after period start": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 11, tzinfo=datetime.UTC),
                overlaps=True,
            ),
            "starts before period start and ends at period end": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 14, tzinfo=datetime.UTC),
                overlaps=True,
            ),
            "starts after period start and ends before period end": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 11, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 13, tzinfo=datetime.UTC),
                overlaps=True,
            ),
            "starts at period start and ends at period end": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 10, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 14, tzinfo=datetime.UTC),
                overlaps=True,
            ),
            "starts before period start and ends after period end": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                overlaps=True,
            ),
            "starts at period start and ends after period end": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 10, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                overlaps=True,
            ),
            "starts before period end and ends after period end": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 13, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                overlaps=True,
            ),
            "starts at period end and ends after period end": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 14, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                overlaps=False,
            ),
            "starts after period end and ends after period end": OverlapParams(
                start=datetime.datetime(2024, 1, 1, 15, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                overlaps=False,
            ),
        }
    ),
)
def test_reservable_time_span__overlapping_with_period(start, end, overlaps):
    origin_hauki_resource = OriginHaukiResourceFactory.create(id=205872)
    ReservableTimeSpanFactory.create(resource=origin_hauki_resource, start_datetime=start, end_datetime=end)

    objs = ReservableTimeSpan.objects.overlapping_with_period(
        start=datetime.datetime(2024, 1, 1, 10, 00, tzinfo=datetime.UTC),
        end=datetime.datetime(2024, 1, 1, 14, 00, tzinfo=datetime.UTC),
    )

    assert objs.count() == (1 if overlaps else 0)


class FillParams(NamedTuple):
    start: datetime.datetime
    end: datetime.datetime
    fills: bool


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "starts before period start and ends before period start": FillParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 9, tzinfo=datetime.UTC),
                fills=False,
            ),
            "starts before period start and ends at period start": FillParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 10, tzinfo=datetime.UTC),
                fills=False,
            ),
            "starts before period start and ends after period start": FillParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 11, tzinfo=datetime.UTC),
                fills=False,
            ),
            "starts before period start and ends at period end": FillParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 14, tzinfo=datetime.UTC),
                fills=True,
            ),
            "starts after period start and ends before period end": FillParams(
                start=datetime.datetime(2024, 1, 1, 11, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 13, tzinfo=datetime.UTC),
                fills=False,
            ),
            "starts at period start and ends at period end": FillParams(
                start=datetime.datetime(2024, 1, 1, 10, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 14, tzinfo=datetime.UTC),
                fills=True,
            ),
            "starts before period start and ends after period end": FillParams(
                start=datetime.datetime(2024, 1, 1, 8, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                fills=True,
            ),
            "starts at period start and ends after period end": FillParams(
                start=datetime.datetime(2024, 1, 1, 10, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                fills=True,
            ),
            "starts before period end and ends after period end": FillParams(
                start=datetime.datetime(2024, 1, 1, 13, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                fills=False,
            ),
            "starts at period end and ends after period end": FillParams(
                start=datetime.datetime(2024, 1, 1, 14, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                fills=False,
            ),
            "starts after period end and ends after period end": FillParams(
                start=datetime.datetime(2024, 1, 1, 15, tzinfo=datetime.UTC),
                end=datetime.datetime(2024, 1, 1, 16, tzinfo=datetime.UTC),
                fills=False,
            ),
        }
    ),
)
def test_reservable_time_span__fully_fill_period(start, end, fills):
    origin_hauki_resource = OriginHaukiResourceFactory.create(id=205872)
    ReservableTimeSpanFactory.create(resource=origin_hauki_resource, start_datetime=start, end_datetime=end)

    objs = ReservableTimeSpan.objects.fully_fill_period(
        start=datetime.datetime(2024, 1, 1, 10, 00, tzinfo=datetime.UTC),
        end=datetime.datetime(2024, 1, 1, 14, 00, tzinfo=datetime.UTC),
    )

    assert objs.count() == (1 if fills else 0)
