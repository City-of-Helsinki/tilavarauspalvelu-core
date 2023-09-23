from unittest import mock

from opening_hours.enums import State
from opening_hours.hours import get_opening_hours


def _get_mocked_opening_hours(opening_time_variables: dict | None = None):
    if opening_time_variables is None:
        opening_time_variables = {}

    return {
        "count": 1,
        "next": None,
        "previous": None,
        "results": [
            {
                "resource": {
                    "id": 1234,
                    "name": {"fi": "Test resource", "sv": None, "en": None},
                    "timezone": "Europe/Helsinki",
                    "origins": [
                        {
                            "data_source": {"id": "tvp", "name": {"fi": "Tilavarauspalvelu", "sv": None, "en": None}},
                            "origin_id": "proper-uuid",
                        }
                    ],
                },
                "opening_hours": [
                    {
                        "date": "2022-12-12",
                        "times": [
                            {
                                "name": "",
                                "description": "",
                                "start_time": "08:00:00",
                                "end_time": "17:00:00",
                                "end_time_on_next_day": False,
                                "full_day": False,
                                "resource_state": "open",
                                "periods": [1234, 1234],
                                **opening_time_variables,  # Override default values with passed values
                            }
                        ],
                    }
                ],
            }
        ],
    }


@mock.patch(
    "opening_hours.hours.make_hauki_get_request",
    return_value=_get_mocked_opening_hours(),
)
def test__hauki__get_opening_hours(mocked_make_hauki_get_request):
    data = get_opening_hours("resource_id", "2020-01-01", "2020-01-01")

    assert len(data) == 1
    assert len(data[0]["times"]) == 1


@mock.patch(
    "opening_hours.hours.make_hauki_get_request",
    return_value=_get_mocked_opening_hours(
        opening_time_variables={
            "start_time": None,
            "end_time": None,
            "resource_state": "closed",
        }
    ),
)
def test__hauki__get_opening_hours__null_start_and_end_times(mocked_make_hauki_get_request):
    data = get_opening_hours("resource_id", "2020-01-01", "2020-01-01")

    assert len(data) == 1
    assert len(data[0]["times"]) == 1
    assert data[0]["times"][0].start_time is None
    assert data[0]["times"][0].end_time is None


@mock.patch(
    "opening_hours.hours.make_hauki_get_request",
    return_value=_get_mocked_opening_hours(
        opening_time_variables={
            "resource_state": "some_funky_state",
        }
    ),
)
def test__hauki__get_opening_hours__resource_state_is_non_defined_is_undefined(mocked_make_hauki_get_request):
    data = get_opening_hours("resource_id", "2020-01-01", "2020-01-01")

    assert len(data) == 1
    assert len(data[0]["times"]) == 1
    assert data[0]["times"][0].resource_state == State.UNDEFINED


@mock.patch(
    "opening_hours.hours.make_hauki_get_request",
    return_value=_get_mocked_opening_hours(
        opening_time_variables={
            "resource_state": None,
        }
    ),
)
def test__hauki__get_opening_hours__resource_state_is_none_is_undefined(mocked_make_hauki_get_request):
    data = get_opening_hours("resource_id", "2020-01-01", "2020-01-01")

    assert len(data) == 1
    assert len(data[0]["times"]) == 1
    assert data[0]["times"][0].resource_state == State.UNDEFINED
