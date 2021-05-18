import datetime
from unittest import mock

from assertpy import assert_that
from django.test.testcases import TestCase

from opening_hours.hours import TimeElement
from opening_hours.utils import (
    get_resources_total_hours,
    get_resources_total_hours_per_resource,
)


def get_mocked_hours():
    return [
        {
            "resource_id": 123,
            "date": datetime.datetime.strptime("2021-01-01", "%Y-%m-%d").date(),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                ),
            ],
        },
        {
            "resource_id": 123,
            "date": datetime.datetime.strptime("2021-01-02", "%Y-%m-%d").date(),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                ),
            ],
        },
    ]


@mock.patch("opening_hours.utils.get_opening_hours", return_value=get_mocked_hours())
class GetResourcesTotalHoursTestCase(TestCase):
    def test_total_hours_sums_up_correct(self, mock):
        total_hours = get_resources_total_hours(
            [123], datetime.date(2020, 1, 1), datetime.date(2020, 1, 2)
        )
        assert_that(total_hours).is_equal_to(24)


@mock.patch("opening_hours.utils.get_opening_hours", return_value=get_mocked_hours())
class GetResourcesTotalHoursListTestCase(TestCase):
    def test_resource_total_hours_per_resource(self, mock):
        total_hours_dict = get_resources_total_hours_per_resource(
            [123], datetime.date(2020, 1, 1), datetime.date(2020, 1, 2)
        )
        assert_that(total_hours_dict.get(123)).is_equal_to(24)

    def test_resource_total_hours_per_resource_when_multiple_resource(self, mock):
        ret_val = get_mocked_hours()
        ret_val.append(
            {
                "resource_id": 321,
                "date": datetime.datetime.strptime("2021-01-02", "%Y-%m-%d").date(),
                "times": [
                    TimeElement(
                        start_time=datetime.time(hour=0),
                        end_time=datetime.time(hour=22),
                        end_time_on_next_day=False,
                    ),
                ],
            }
        )
        mock.return_value = ret_val

        total_hours_dict = get_resources_total_hours_per_resource(
            [123, 321], datetime.date(2020, 1, 1), datetime.date(2020, 1, 2)
        )
        assert_that(total_hours_dict.get(123)).is_equal_to(24)
        assert_that(total_hours_dict.get(321)).is_equal_to(22)
