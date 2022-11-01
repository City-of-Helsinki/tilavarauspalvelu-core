import json
from unittest import mock

from assertpy import assert_that
from django.test import TestCase, override_settings

from opening_hours.hours import get_opening_hours


@mock.patch("opening_hours.hours.make_hauki_get_request")
@override_settings(HAUKI_API_URL="asdf")
class GetOpeningHoursTestCase(TestCase):
    @classmethod
    def get_opening_hours(self):
        with open(
            "opening_hours/tests/fixtures/hauki_opening_hours_response.json"
        ) as data:
            response = json.load(data)

        return response

    @classmethod
    def get_opening_hours_closed(self):
        with open(
            "opening_hours/tests/fixtures/hauki_opening_hours_response_resource_closed.json"
        ) as data:
            response = json.load(data)

        return response

    def test_get_opening_hours(self, mock):
        mock.return_value = self.get_opening_hours()

        data = get_opening_hours("resource_id", "2020-01-01", "2020-01-01")
        assert_that(data).is_not_empty()
        assert_that(data[0]["times"]).is_not_empty()

    def test_get_opening_hours_null_start_end_ok(self, mock):
        mock.return_value = self.get_opening_hours_closed()

        data = get_opening_hours("resource_id", "2020-01-01", "2020-01-01")
        assert_that(data).is_not_empty()
        assert_that(data[0]["times"]).is_not_empty()
        assert_that(data[0]["times"][0].start_time).is_none()
        assert_that(data[0]["times"][0].end_time).is_none()
