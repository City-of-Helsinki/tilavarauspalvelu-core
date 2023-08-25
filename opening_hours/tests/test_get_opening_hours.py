import json
from unittest import mock

from assertpy import assert_that
from django.test import TestCase, override_settings

from opening_hours.enums import State
from opening_hours.hours import get_opening_hours


@mock.patch("opening_hours.hours.make_hauki_get_request")
@override_settings(HAUKI_API_URL="asdf")
class GetOpeningHoursTestCase(TestCase):
    @classmethod
    def get_opening_hours(self):
        with open("opening_hours/tests/fixtures/hauki_opening_hours_response.json") as data:
            response = json.load(data)

        return response

    @classmethod
    def get_opening_hours_closed(self):
        with open("opening_hours/tests/fixtures/hauki_opening_hours_response_resource_closed.json") as data:
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

    def test_get_opening_hours_with_non_defined_state_is_undefined(self, mock):
        hours_data = self.get_opening_hours()
        hours_data["results"][0]["opening_hours"][0]["times"][0]["resource_state"] = "some_funky_state"
        mock.return_value = hours_data

        data = get_opening_hours("resource_id", "2020-01-01", "2020-01-01")
        assert_that(data).is_not_empty()
        assert_that(data[0]["times"]).is_not_empty()
        assert_that(data[0]["times"][0].resource_state).is_equal_to(State.UNDEFINED)

    def test_get_opening_hours_with_resource_state_is_none_is_undefined(self, mock):
        hours_data = self.get_opening_hours()
        hours_data["results"][0]["opening_hours"][0]["times"][0]["resource_state"] = None
        mock.return_value = hours_data

        data = get_opening_hours("resource_id", "2020-01-01", "2020-01-01")
        assert_that(data).is_not_empty()
        assert_that(data[0]["times"]).is_not_empty()
        assert_that(data[0]["times"][0].resource_state).is_equal_to(State.UNDEFINED)
