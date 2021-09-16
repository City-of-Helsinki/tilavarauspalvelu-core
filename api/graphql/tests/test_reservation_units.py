import datetime
import json
from unittest import mock

import snapshottest
from assertpy import assert_that
from django.conf import settings
from django.test import override_settings
from freezegun import freeze_time
from graphene_django.utils import GraphQLTestCase
from rest_framework.test import APIClient

from opening_hours.enums import State
from opening_hours.hours import TimeElement
from reservation_units.tests.factories import (
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
)
from spaces.tests.factories import SpaceFactory


@freeze_time("2021-05-03")
class ReservationUnitTestCase(GraphQLTestCase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.type = ReservationUnitTypeFactory(name="Test type")
        large_space = SpaceFactory(max_persons=100, name="Large space")
        small_space = SpaceFactory(max_persons=10, name="Small space")
        cls.reservation_unit = ReservationUnitFactory(
            name="Test name",
            reservation_unit_type=cls.type,
            uuid="3774af34-9916-40f2-acc7-68db5a627710",
            spaces=[large_space, small_space],
        )

        cls.api_client = APIClient()

    def test_getting_reservation_units(self):
        self.maxDiff = None
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            name
                            description
                            spaces {
                              name
                            }
                            resources {
                              name
                            }
                            services {
                              name
                            }
                            requireIntroduction
                            purposes {
                              name
                            }
                            images {
                              imageUrl
                              mediumUrl
                              smallUrl
                            }
                            location {
                              longitude
                              latitude
                            }
                            maxPersons
                            reservationUnitType {
                              name
                            }
                            termsOfUse
                            equipment {
                              name
                            }
                            contactInformation
                          }
                        }
                    }
                }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_should_be_able_to_find_by_pk(self):
        query = (
            f"{{\n"
            f"reservationUnitByPk(pk: {self.reservation_unit.id}) {{\n"
            f"id name pk\n"
            f"}}"
            f"}}"
        )
        response = self.query(query)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("reservationUnitByPk").get("pk")
        ).is_equal_to(self.reservation_unit.id)

    def test_getting_hauki_url(self):
        settings.HAUKI_SECRET = "HAUKISECRET"
        settings.HAUKI_ADMIN_UI_URL = "https://test.com"
        settings.HAUKI_ORIGIN_ID = "origin"
        settings.HAUKI_ORGANISATION_ID = "ORGANISATION"
        self.maxDiff = None
        query = (
            f"{{\n"
            f"reservationUnitByPk(pk: {self.reservation_unit.id}) {{\n"
            f"name\n"
            f"haukiUrl{{url}}"
            f"}}"
            f"}}"
        )
        response = self.query(query)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_should_error_when_not_found_by_pk(self):
        query = (
            f"{{\n"
            f"reservationUnitByPk(pk: {self.reservation_unit.id + 666}) {{\n"
            f"id\n"
            f"}}"
            f"}}"
        )
        response = self.query(query)

        content = json.loads(response.content)
        errors = content.get("errors")
        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to(
            "No ReservationUnit matches the given query."
        )

    @override_settings(HAUKI_ORIGIN_ID="1234", HAUKI_API_URL="url")
    @mock.patch("opening_hours.utils.opening_hours_client.get_opening_hours")
    @mock.patch("opening_hours.hours.make_hauki_request")
    def test_opening_hours(self, mock_periods, mock_opening_times):
        mock_opening_times.return_value = get_mocked_opening_hours(
            self.reservation_unit.uuid
        )
        mock_periods.return_value = get_mocked_periods()
        query = (
            f"{{\n"
            f"reservationUnitByPk(pk: {self.reservation_unit.id}) {{\n"
            f"id\n"
            f'openingHours(periods:true openingTimes:true startDate:"2020-01-01" endDate:"2022-01-01")'
            f"{{openingTimes{{date}} openingTimePeriods{{timeSpans{{startTime}}}}"
            f"}}"
            f"}}"
            f"}}"
        )
        response = self.query(query)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("reservationUnitByPk")
            .get("openingHours")
            .get("openingTimePeriods")[0]
            .get("timeSpans")
        ).is_not_empty()

        assert_that(
            content.get("data")
            .get("reservationUnitByPk")
            .get("openingHours")
            .get("openingTimes")
        ).is_not_empty()

    def test_filtering_by_type(self):
        response = self.query(
            f"query {{"
            f"reservationUnits(reservationUnitType:{self.type.id}){{"
            f"edges {{"
            f"node {{"
            f"name "
            f"reservationUnitType {{"
            f"name"
            f"}}"
            f"}}"
            f"}}"
            f"}}"
            f"}}"
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_type_not_found(self):
        response = self.query(
            """
            query {
                reservationUnits(reservationUnitType:345987){
                edges {
                    node {
                        name
                    }
                }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_empty()

    def test_filtering_by_max_persons(self):
        response = self.query(
            """
            query {
                reservationUnits(maxPersonsLte:120, maxPersonsGte:60) {
                    edges {
                        node{
                            name maxPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_max_persons_not_found(self):
        response = self.query(
            """
            query {
                reservationUnits(maxPersonsLte:20, maxPersonsGte:15) {
                    edges {
                        node{
                            name maxPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)


def get_mocked_opening_hours(uuid):
    resource_id = f"{settings.HAUKI_ORIGIN_ID}:{uuid}"
    return [
        {
            "resource_id": resource_id,
            "date": datetime.date(2020, 1, 1),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                    resource_state=State.WITH_RESERVATION,
                    periods=[1, 2, 3, 4],
                ),
            ],
        },
        {
            "resource_id": resource_id,
            "date": datetime.date(2020, 1, 2),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=10),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                    resource_state=State.WITH_RESERVATION,
                    periods=[
                        1,
                    ],
                ),
            ],
        },
    ]


def get_mocked_periods():
    data = [
        {
            "id": 38600,
            "resource": 26220,
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
                    "id": 29596,
                    "period": 38600,
                    "time_spans": [
                        {
                            "id": 39788,
                            "group": 29596,
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
                            "id": 39789,
                            "group": 29596,
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
