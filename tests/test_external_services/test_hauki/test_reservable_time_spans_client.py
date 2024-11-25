from __future__ import annotations

import datetime
import zoneinfo

import pytest
from freezegun import freeze_time

from tests.helpers import patch_method
from tests.mocks import MockResponse
from tilavarauspalvelu.enums import HaukiResourceState
from tilavarauspalvelu.exceptions import ReservableTimeSpanClientNothingToDoError
from tilavarauspalvelu.models import ReservableTimeSpan
from tilavarauspalvelu.utils.opening_hours.hauki_api_client import HaukiAPIClient
from tilavarauspalvelu.utils.opening_hours.hauki_api_types import (
    HaukiAPIOpeningHoursResponseDate,
    HaukiAPIOpeningHoursResponseItem,
    HaukiAPIOpeningHoursResponseResource,
    HaukiAPIOpeningHoursResponseTime,
    HaukiTranslatedField,
)
from tilavarauspalvelu.utils.opening_hours.reservable_time_span_client import ReservableTimeSpanClient
from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement
from utils.date_utils import DEFAULT_TIMEZONE, local_date

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def _get_date(*, day: int = 1, hour: int = 0, minute: int = 0, tzinfo: zoneinfo.ZoneInfo | None = None):
    return datetime.datetime(2023, 1, day, hour, minute, 0, tzinfo=tzinfo or DEFAULT_TIMEZONE)


def _get_resource_opening_hours() -> HaukiAPIOpeningHoursResponseItem:
    """
    Contains cases of opening hours, to test the parsing logic.
    Day 1:
        10:00 - 16:00 (with reservation)
        10:00 - 12:00 (open and reservable)
        14:00 - 16:00 (closed)
    Day 2:
        10:00 - 20:00 (undefined)
        18:00 - 06:00 (open and reservable)

    Day 1 is reservable from 10:00 to 14:00
    Day 2 is reservable from 20:00 to 06:00
    """
    return HaukiAPIOpeningHoursResponseItem(
        resource=HaukiAPIOpeningHoursResponseResource(
            id=0,
            name=HaukiTranslatedField(
                fi="Test resource",
                sv=None,
                en=None,
            ),
            timezone="Europe/Helsinki",
            origins=[],
        ),
        opening_hours=[
            HaukiAPIOpeningHoursResponseDate(
                date="2023-01-01",
                times=[
                    HaukiAPIOpeningHoursResponseTime(
                        name="",
                        description="",
                        start_time="10:00:00",
                        end_time="16:00:00",
                        end_time_on_next_day=False,
                        full_day=False,
                        resource_state=HaukiResourceState.WITH_RESERVATION,
                        periods=[1],
                    ),
                    HaukiAPIOpeningHoursResponseTime(
                        name="",
                        description="",
                        start_time="10:00:00",
                        end_time="12:00:00",
                        end_time_on_next_day=False,
                        full_day=False,
                        resource_state=HaukiResourceState.OPEN_AND_RESERVABLE,
                        periods=[1],
                    ),
                    HaukiAPIOpeningHoursResponseTime(
                        name="",
                        description="",
                        start_time="14:00:00",
                        end_time="16:00:00",
                        end_time_on_next_day=False,
                        full_day=False,
                        resource_state=HaukiResourceState.CLOSED,
                        periods=[1],
                    ),
                ],
            ),
            HaukiAPIOpeningHoursResponseDate(
                date="2023-01-02",
                times=[
                    HaukiAPIOpeningHoursResponseTime(
                        name="",
                        description="",
                        start_time="10:00:00",
                        end_time="20:00:00",
                        end_time_on_next_day=False,
                        full_day=False,
                        resource_state=HaukiResourceState.UNDEFINED,
                        periods=[1],
                    ),
                    HaukiAPIOpeningHoursResponseTime(
                        name="",
                        description="",
                        start_time="18:00:00",
                        end_time="06:00:00",
                        end_time_on_next_day=True,
                        full_day=False,
                        resource_state=HaukiResourceState.OPEN_AND_RESERVABLE,
                        periods=[1],
                    ),
                ],
            ),
        ],
    )


def _get_parsed_time_spans() -> list[TimeSpanElement]:
    return [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=16),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=14),
            end_datetime=_get_date(day=1, hour=16),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=10),
            end_datetime=_get_date(day=2, hour=20),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=18),
            end_datetime=_get_date(day=3, hour=6),
            is_reservable=True,
        ),
    ]


def _get_reservable_and_closed_time_spans() -> tuple[list[TimeSpanElement], list[TimeSpanElement]]:
    reservable = [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=16),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=18),
            end_datetime=_get_date(day=3, hour=6),
            is_reservable=True,
        ),
    ]

    closed = [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=14),
            end_datetime=_get_date(day=1, hour=16),
            is_reservable=False,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=10),
            end_datetime=_get_date(day=2, hour=20),
            is_reservable=False,
        ),
    ]

    return reservable, closed


def _get_normalised_time_spans() -> list[TimeSpanElement]:
    return [
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=14),
            is_reservable=True,
        ),
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=20),
            end_datetime=_get_date(day=3, hour=6),
            is_reservable=True,
        ),
    ]


#############################################
# ReservableTimeSpanClient._init_date_range #
#############################################


@freeze_time("2020-01-01")
def test__ReservableTimeSpanClient__init__latest_fetched_date_is_none(reservation_unit):
    reservation_unit.origin_hauki_resource.latest_fetched_date = None
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)

    today = datetime.date(2020, 1, 1)

    client._init_date_range()
    assert client.start_date == today
    assert client.end_date == datetime.date(2021, 12, 31)


@freeze_time("2020-01-01")
def test__ReservableTimeSpanClient__init__latest_fetched_date_is_defined(reservation_unit):
    today = datetime.date(2020, 1, 1)

    latest_fetched_date = today + datetime.timedelta(days=ReservableTimeSpanClient.DAYS_TO_FETCH - 20)
    assert latest_fetched_date == datetime.date(2021, 12, 11)

    reservation_unit.origin_hauki_resource.latest_fetched_date = latest_fetched_date
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)
    client._init_date_range()

    # Latest fetched date + 1 day
    assert client.start_date == datetime.date(2021, 12, 12)
    # today + DAYS_TO_FETCH, rounded to the end of the month
    assert client.end_date == datetime.date(2021, 12, 31)


def test__ReservableTimeSpanClient__init__latest_fetched_date_is_defined__raise(reservation_unit):
    latest_fetched_date = local_date() + datetime.timedelta(days=ReservableTimeSpanClient.DAYS_TO_FETCH + 31)
    reservation_unit.origin_hauki_resource.latest_fetched_date = latest_fetched_date

    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)
    with pytest.raises(ReservableTimeSpanClientNothingToDoError):
        client._init_date_range()


##############################################################
# ReservableTimeSpanClient._get_opening_hours_from_hauki_api #
##############################################################


@patch_method(
    HaukiAPIClient.get,
    return_value=MockResponse(status_code=200, json={"count": 1, "results": [_get_resource_opening_hours()]}),
)
def test__ReservableTimeSpanClient__get_opening_hours_from_hauki_api(reservation_unit):
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)
    client._init_date_range()

    opening_hours = client._get_opening_hours_from_hauki_api()
    assert opening_hours == _get_resource_opening_hours()


#################################################
# ReservableTimeSpanClient._parse_opening_hours #
#################################################


def test__ReservableTimeSpanClient__parse_opening_hours(reservation_unit):
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)

    opening_hours = _get_resource_opening_hours()

    parsed_opening_hours = client._parse_opening_hours(opening_hours)
    assert parsed_opening_hours == _get_parsed_time_spans()


#######################################################################
# ReservableTimeSpanClient._split_to_reservable_and_closed_time_spans #
#######################################################################


def test__ReservableTimeSpanClient__split_to_reservable_and_closed_time_spans(reservation_unit):
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)

    parsed_time_spans = _get_parsed_time_spans()

    reservable_time_spans, closed_time_spans = client._split_to_reservable_and_closed_time_spans(parsed_time_spans)
    assert reservable_time_spans == _get_reservable_and_closed_time_spans()[0]
    assert closed_time_spans == _get_reservable_and_closed_time_spans()[1]


def test__ReservableTimeSpanClient__split_to_reservable_and_closed_time_spans__reservable__adjacent_not_overlapping(
    reservation_unit,
):
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)

    parsed_time_spans = [
        # Day 1
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
        # Extends to the future
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=12),
            end_datetime=_get_date(day=1, hour=14),
            is_reservable=True,
        ),
        # Extends to the future
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=15),
            end_datetime=_get_date(day=1, hour=20),
            is_reservable=True,
        ),
        # Day 2, kept as is
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=10),
            end_datetime=_get_date(day=3, hour=20),
            is_reservable=True,
        ),
    ]

    reservable_time_spans, closed_time_spans = client._split_to_reservable_and_closed_time_spans(parsed_time_spans)

    assert reservable_time_spans == [
        # First two time spans are combined
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=14),
            is_reservable=True,
        ),
        # Third time span is kept as is
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=15),
            end_datetime=_get_date(day=1, hour=20),
            is_reservable=True,
        ),
        # Fourth time span is kept as is
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=10),
            end_datetime=_get_date(day=3, hour=20),
            is_reservable=True,
        ),
    ]
    assert closed_time_spans == []


def test__ReservableTimeSpanClient__split_to_reservable_and_closed_time_spans__reservable__overlapping(
    reservation_unit,
):
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)

    parsed_time_spans = [
        # Day 1
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
        # Duplicate time span
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
        # Day 2
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=15),
            end_datetime=_get_date(day=2, hour=20),
            is_reservable=True,
        ),
        # Fully inside
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=16),
            end_datetime=_get_date(day=2, hour=19),
            is_reservable=True,
        ),
        # Extends to the past
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=14),
            end_datetime=_get_date(day=2, hour=18),
            is_reservable=True,
        ),
        # Extends to the future
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=19),
            end_datetime=_get_date(day=2, hour=21),
            is_reservable=True,
        ),
    ]

    reservable_time_spans, closed_time_spans = client._split_to_reservable_and_closed_time_spans(parsed_time_spans)

    assert reservable_time_spans == [
        # First two time spans are "combined", as they are the same
        TimeSpanElement(
            start_datetime=_get_date(day=1, hour=10),
            end_datetime=_get_date(day=1, hour=12),
            is_reservable=True,
        ),
        # Fourth time span is fully inside the third time span, so they are merged
        # Fifth time span extends to the past, so it is merged with the fourth time span
        # Sixth time span extends to the future, so it is merged with the fourth time span
        TimeSpanElement(
            start_datetime=_get_date(day=2, hour=14),
            end_datetime=_get_date(day=2, hour=21),
            is_reservable=True,
        ),
    ]
    assert closed_time_spans == []


##########################################################
# ReservableTimeSpanClient._create_reservable_time_spans #
##########################################################


def test__ReservableTimeSpanClient__create_reservable_time_spans(reservation_unit):
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)

    normalised_time_spans = _get_normalised_time_spans()

    created_time_spans = client._create_reservable_time_spans(normalised_time_spans)

    assert created_time_spans == list(ReservableTimeSpan.objects.all())
    assert len(created_time_spans) == 2
    assert created_time_spans[0].start_datetime == _get_date(day=1, hour=10)
    assert created_time_spans[0].end_datetime == _get_date(day=1, hour=14)
    assert created_time_spans[1].start_datetime == _get_date(day=2, hour=20)
    assert created_time_spans[1].end_datetime == _get_date(day=3, hour=6)


def test__ReservableTimeSpanClient__create_reservable_time_spans__overlapping_with_last_existing(reservation_unit):
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)

    ReservableTimeSpan.objects.create(
        resource=reservation_unit.origin_hauki_resource,
        start_datetime=_get_date(day=1, hour=8),
        end_datetime=_get_date(day=1, hour=12),
    )

    client._create_reservable_time_spans(
        [
            # Overlaps with the last already existing time span, so it should be extended
            TimeSpanElement(
                start_datetime=_get_date(day=1, hour=10),
                end_datetime=_get_date(day=1, hour=14),
                is_reservable=True,
            ),
            # Does not overlap
            TimeSpanElement(
                start_datetime=_get_date(day=2, hour=12),
                end_datetime=_get_date(day=2, hour=16),
                is_reservable=True,
            ),
        ]
    )

    reservable_time_spans = ReservableTimeSpan.objects.all()
    assert reservable_time_spans[0].start_datetime == _get_date(day=1, hour=8)
    assert reservable_time_spans[0].end_datetime == _get_date(day=1, hour=14)
    assert reservable_time_spans[1].start_datetime == _get_date(day=2, hour=12)
    assert reservable_time_spans[1].end_datetime == _get_date(day=2, hour=16)

    ################################
    # ReservableTimeSpanClient.run #
    ################################


@patch_method(HaukiAPIClient.get_resource_opening_hours, return_value={"results": ["foo"]})
def test__ReservableTimeSpanClient__run__timezones_are_preserved(reservation_unit):
    client = ReservableTimeSpanClient(reservation_unit.origin_hauki_resource)

    ny_tz = zoneinfo.ZoneInfo("America/New_York")

    return_value = _get_resource_opening_hours()
    return_value["resource"]["timezone"] = str(ny_tz)
    HaukiAPIClient.get_resource_opening_hours.return_value = return_value

    created_time_spans = client.run()

    assert len(created_time_spans) == 2
    assert created_time_spans[0].start_datetime == _get_date(day=1, hour=10, tzinfo=ny_tz).astimezone(DEFAULT_TIMEZONE)
    assert created_time_spans[0].end_datetime == _get_date(day=1, hour=14, tzinfo=ny_tz).astimezone(DEFAULT_TIMEZONE)
    assert created_time_spans[1].start_datetime == _get_date(day=2, hour=20, tzinfo=ny_tz).astimezone(DEFAULT_TIMEZONE)
    assert created_time_spans[1].end_datetime == _get_date(day=3, hour=6, tzinfo=ny_tz).astimezone(DEFAULT_TIMEZONE)
