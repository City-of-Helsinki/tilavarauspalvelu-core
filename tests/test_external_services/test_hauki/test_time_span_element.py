import datetime
from typing import Any, NamedTuple

import pytest
from graphene_django_extensions.testing.utils import parametrize_helper

from tilavarauspalvelu.enums import HaukiResourceState
from tilavarauspalvelu.utils.opening_hours.hauki_api_types import HaukiAPIOpeningHoursResponseTime
from tilavarauspalvelu.utils.opening_hours.time_span_element import TimeSpanElement
from utils.date_utils import DEFAULT_TIMEZONE

from tests.test_external_services.test_hauki.test_reservable_time_spans_client import _get_date


class TimeSpanElementParams(NamedTuple):
    time_element_changes: dict[str, Any]
    expected: TimeSpanElement | None


@pytest.mark.parametrize(
    **parametrize_helper(
        {
            "Status: Open": TimeSpanElementParams(
                time_element_changes={"resource_state": HaukiResourceState.OPEN},
                expected=None,
            ),
            "Start time greater than end time": TimeSpanElementParams(
                time_element_changes={
                    "start_time": "10:00:00",
                    "end_time": "08:00:00",
                },
                expected=None,
            ),
            "Valid reservable": TimeSpanElementParams(
                time_element_changes={
                    "resource_state": HaukiResourceState.OPEN_AND_RESERVABLE,
                    "start_time": "10:00:00",
                    "end_time": "12:00:00",
                },
                expected=TimeSpanElement(
                    start_datetime=_get_date(day=1, hour=10),
                    end_datetime=_get_date(day=1, hour=12),
                    is_reservable=True,
                ),
            ),
            "Valid closed": TimeSpanElementParams(
                time_element_changes={
                    "resource_state": HaukiResourceState.CLOSED,
                    "start_time": "10:00:00",
                    "end_time": "12:00:00",
                },
                expected=TimeSpanElement(
                    start_datetime=_get_date(day=1, hour=10),
                    end_datetime=_get_date(day=1, hour=12),
                    is_reservable=False,
                ),
            ),
            "End time on the next day": TimeSpanElementParams(
                time_element_changes={
                    "resource_state": HaukiResourceState.CLOSED,
                    "start_time": "10:00:00",
                    "end_time": "12:00:00",
                    "end_time_on_next_day": True,
                },
                expected=TimeSpanElement(
                    start_datetime=_get_date(day=1, hour=10),
                    end_datetime=_get_date(day=2, hour=12),
                    is_reservable=False,
                ),
            ),
            "Full day reservation": TimeSpanElementParams(
                time_element_changes={
                    "resource_state": HaukiResourceState.OPEN_AND_RESERVABLE,
                    "start_time": None,
                    "end_time": None,
                    "end_time_on_next_day": True,
                },
                expected=TimeSpanElement(
                    start_datetime=_get_date(day=1, hour=0),
                    end_datetime=_get_date(day=2, hour=0),
                    is_reservable=True,
                ),
            ),
        },
    )
)
def test__TimeSpanElement__create_from_time_element(time_element_changes, expected):
    time_element_kwargs = {
        "name": "",
        "description": "",
        "start_time": None,
        "end_time": None,
        "end_time_on_next_day": False,
        "resource_state": HaukiResourceState.UNDEFINED,
        "full_day": False,
        "periods": [],
    }
    time_element_kwargs.update(time_element_changes)

    time_span = TimeSpanElement.create_from_time_element(
        date=datetime.date(2023, 1, 1),
        timezone=DEFAULT_TIMEZONE,
        time_element=HaukiAPIOpeningHoursResponseTime(**time_element_kwargs),
    )

    assert time_span == expected


def test__TimeSpanElement__copy():
    time_span = TimeSpanElement(
        start_datetime=_get_date(day=1, hour=10),
        end_datetime=_get_date(day=2, hour=12),
        is_reservable=False,
    )
    assert time_span.__copy__() == time_span  # noqa: PLC2801
