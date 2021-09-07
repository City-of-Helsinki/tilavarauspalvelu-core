from unittest import mock

from assertpy import assert_that
from django.test import override_settings

from opening_hours.hours import get_periods_for_resource


def get_mocked_periods():
    data = [
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
    return data


@override_settings(HAUKI_ORIGIN_ID="1234", HAUKI_API_URL="url")
@mock.patch("opening_hours.hours.make_hauki_request")
def test_get_periods_for_resource_when_periods(mock):
    mock.return_value = get_mocked_periods()
    data = get_periods_for_resource("1234")

    assert_that(data).is_not_empty()
    assert_that(data[0].time_spans).is_not_empty()


@override_settings(HAUKI_ORIGIN_ID="1234", HAUKI_API_URL="url")
@mock.patch("opening_hours.hours.make_hauki_request")
def test_get_periods_for_resource_when_empty(mock):
    mock.return_value = []
    data = get_periods_for_resource("1234")

    assert_that(data).is_empty()
