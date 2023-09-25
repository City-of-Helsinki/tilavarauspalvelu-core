from unittest import mock

from opening_hours.hours import get_periods_for_resource
from opening_hours.utils.hauki_api_types import HaukiAPIDatePeriod

mocked_get_resource_periods_response_data: list[HaukiAPIDatePeriod] = [
    {
        "id": 4321,
        "resource": 1234,
        "name": {"fi": "Vakiovuorot", "sv": "", "en": ""},
        "description": {"fi": "", "sv": "", "en": ""},
        "start_date": "2020-01-01",
        "end_date": None,
        "resource_state": "undefined",
        "override": False,
        "origins": [],
        "created": "2021-05-07T13:01:30.477693+03:00",
        "modified": "2021-05-07T13:01:30.477693+03:00",
        "time_span_groups": [
            {
                "id": 1,
                "period": 4321,
                "time_spans": [
                    {
                        "id": 12,
                        "group": 1,
                        "name": {"fi": None, "sv": None, "en": None},
                        "description": {"fi": None, "sv": None, "en": None},
                        "start_time": "09:00:00",
                        "end_time": "21:00:00",
                        "end_time_on_next_day": False,
                        "full_day": False,
                        "weekdays": [6],
                        "resource_state": "open",
                        "created": "2021-05-07T13:01:30.513468+03:00",
                        "modified": "2021-05-07T13:01:30.513468+03:00",
                    },
                    {
                        "id": 11,
                        "group": 1,
                        "name": {
                            "fi": None,
                            "sv": None,
                            "en": None,
                        },
                        "description": {"fi": None, "sv": None, "en": None},
                        "start_time": "09:00:00",
                        "end_time": "21:00:00",
                        "end_time_on_next_day": False,
                        "full_day": False,
                        "weekdays": [7],
                        "resource_state": "open",
                        "created": "2021-05-07T13:01:30.530932+03:00",
                        "modified": "2021-05-07T13:01:30.530932+03:00",
                    },
                ],
                "rules": [],
                "is_removed": False,
            }
        ],
    }
]


@mock.patch("opening_hours.hours.HaukiAPIClient.get", return_value=mocked_get_resource_periods_response_data)
def test__hauki__get_periods_for_resource(mocked_haukiapiclient_get):
    data = get_periods_for_resource("1234")

    assert len(data) == 1
    assert len(data[0].time_spans) == 2


@mock.patch("opening_hours.hours.HaukiAPIClient.get", return_value=[])
def test__hauki__get_periods_for_resource__no_periods(mocked_haukiapiclient_get):
    data = get_periods_for_resource("1234")

    assert len(data) == 0
