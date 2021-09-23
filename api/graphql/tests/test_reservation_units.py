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

from api.graphql.tests.base import GrapheneTestCaseBase
from opening_hours.enums import State
from opening_hours.hours import TimeElement
from reservation_units.models import ReservationUnit
from reservation_units.tests.factories import (
    EquipmentFactory,
    KeywordCategoryFactory,
    KeywordGroupFactory,
    PurposeFactory,
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
)
from resources.tests.factories import ResourceFactory
from services.tests.factories import ServiceFactory
from spaces.tests.factories import SpaceFactory, UnitFactory


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

    def content_is_empty(self, content):
        return len(content["data"]["reservationUnits"]["edges"]) == 0

    def test_filtering_by_type_text(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test type"){
                edges {
                    node {
                        name
                        reservationUnitType{name}
                    }
                }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Nonexisting type"){
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
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_reservation_unit_name(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test name"){
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
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Nonexisting name"){
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
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_reservation_unit_description(self):
        self.reservation_unit.description = "Lorem ipsum"
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Lorem ipsum"){
                edges {
                    node {
                        name
                        description
                    }
                }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Dolor sit"){
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
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_space_name(self):
        space = SpaceFactory(name="space name")
        self.reservation_unit.spaces.set([space])
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"space name"){
                edges {
                    node {
                        name
                        spaces{name}
                    }
                }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"not a space name"){
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
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_keyword_group(self):
        category = KeywordCategoryFactory()

        keyword_group = KeywordGroupFactory(keyword_category=category, name="Sports")
        self.reservation_unit.keyword_groups.set([keyword_group])
        self.reservation_unit.save()
        response = self.query(
            f"query {{"
            f"reservationUnits( keywordGroups:{keyword_group.id}){{"
            f"edges {{"
            f"node {{"
            f"name\n"
            f"keywordGroups{{name}}"
            f"}}"
            f"}}"
            f"}}"
            f"}}"
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        response = self.query(
            f"query {{"
            f"reservationUnits( keywordGroups:{keyword_group.id+214979}){{"
            f"edges {{"
            f"node {{"
            f"name\n"
            f"keywordGroups{{name}}"
            f"}}"
            f"}}"
            f"}}"
            f"}}"
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_empty()


def get_mocked_opening_hours(uuid):
    resource_id = f"{settings.HAUKI_ORIGIN_ID}:{uuid}"
    return [
        {
            "resource_id": resource_id,
            "origin_id": str(uuid),
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
            "origin_id": str(uuid),
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


class ReservationUnitMutationsTestCaseBase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.unit = UnitFactory()
        cls.purpose = PurposeFactory()
        cls.space = SpaceFactory(unit=cls.unit)
        cls.resource = ResourceFactory()
        cls.reservation_unit_type = ReservationUnitTypeFactory()
        cls.service = ServiceFactory()

    def setUp(self):
        self._client.force_login(self.general_admin)


class ReservationUnitCreateAsDraftTestCase(ReservationUnitMutationsTestCaseBase):
    def get_create_query(self):
        return """
        mutation createReservationUnit($input: ReservationUnitCreateMutationInput!) {
            createReservationUnit(input: $input){
                id
                errors {
                    messages field
                }
            }
        }
        """

    def test_create(self):
        data = {
            "isDraft": True,
            "nameFi": "Resunit name",
            "nameEn": "English name",
            "descriptionFi": "desc",
            "unitId": self.unit.id,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("id"))

    def test_create_errors_without_unit_id(self):
        data = {"isDraft": True, "name": "Resunit name"}
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_errors_on_empty_name(self):
        data = {
            "isDraft": True,
            "nameFi": "",
            "nameEn": "English name",
            "descriptionFi": "desc",
            "unitId": self.unit.id,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()

    def test_create_with_minimum_fields_success(self):
        data = {
            "isDraft": True,
            "nameFi": "Resunit name",
            "unitId": self.unit.id,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("id"))

    def test_create_without_is_draft_with_name_and_unit_fails(self):
        data = {
            "name": "Resunit name",
            "unitId": self.unit.id,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

    def test_regular_user_cannot_create(self):
        self._client.force_login(self.regular_joe)
        data = {"isDraft": True, "name": "Resunit name", "unitId": self.unit.id}
        response = self.query(self.get_create_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()


class ReservationUnitCreateAsNotDraftTestCase(ReservationUnitMutationsTestCaseBase):
    """For publish"""

    def get_create_query(self):
        return """
        mutation createReservationUnit($input: ReservationUnitCreateMutationInput!) {
            createReservationUnit(input: $input){
                id
                errors {
                    messages field
                }
            }
        }
        """

    def get_valid_data(self):
        return {
            "isDraft": False,
            "nameFi": "Resunit name",
            "nameEn": "English name",
            "nameSv": "Swedish name",
            "descriptionFi": "descFi",
            "descriptionEn": "descEn",
            "descriptionSv": "descSV",
            "spaceIds": [self.space.id],
            "resourceIds": [self.resource.id],
            "serviceIds": [self.service.id],
            "unitId": self.unit.id,
            "reservationUnitTypeId": self.reservation_unit_type.id,
            "surfaceArea": 100,
            "maxPersons": 10,
            "bufferTimeBetweenReservations": "1:00:00",
        }

    def test_create(self):
        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.is_draft).is_false()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("id"))
        assert_that(res_unit.name_fi).is_equal_to(data.get("nameFi"))
        assert_that(res_unit.name_en).is_equal_to(data.get("nameEn"))
        assert_that(res_unit.name_sv).is_equal_to(data.get("nameSv"))
        assert_that(res_unit.description_fi).is_equal_to(data.get("descriptionFi"))
        assert_that(res_unit.description_en).is_equal_to(data.get("descriptionEn"))
        assert_that(res_unit.description_sv).is_equal_to(data.get("descriptionSv"))
        assert_that(res_unit.spaces.first().id).is_equal_to(self.space.id)
        assert_that(res_unit.resources.first().id).is_equal_to(self.resource.id)
        assert_that(res_unit.services.first().id).is_equal_to(self.service.id)
        assert_that(res_unit.reservation_unit_type).is_equal_to(
            self.reservation_unit_type
        )
        assert_that(res_unit.surface_area).is_equal_to(data.get("surfaceArea"))
        assert_that(res_unit.max_persons).is_equal_to(data.get("maxPersons"))
        assert_that(res_unit.buffer_time_between_reservations).is_equal_to(
            datetime.timedelta(hours=1)
        )

    def test_create_errors_on_empty_name_translations(self):
        data = self.get_valid_data()
        data["nameEn"] = ""
        data["nameSv"] = ""

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_missing_name_translations(self):
        data = self.get_valid_data()
        data.pop("nameSv")
        data.pop("nameEn")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_description_translations(self):
        data = self.get_valid_data()
        data["descriptionFi"] = ""
        data["descriptionSv"] = ""
        data["descriptionEn"] = ""

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_missing_description_translations(self):
        data = self.get_valid_data()
        data.pop("descriptionFi")
        data.pop("descriptionEn")
        data.pop("descriptionSv")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_without_unit_id(self):
        data = self.get_valid_data()
        data.pop("unitId")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_space_and_missing_resource(self):
        data = self.get_valid_data()
        data.pop("resourceIds")
        data["spaceIds"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_resource_and_missing_space(self):
        data = self.get_valid_data()
        data.pop("spaceIds")
        data["resourceIds"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_space_and_resource(self):
        data = self.get_valid_data()
        data["resourceIds"] = []
        data["spaceIds"] = []

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_missing_space_and_resource(self):
        data = self.get_valid_data()
        data.pop("resourceIds")
        data.pop("spaceIds")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_wrong_type_of_space_id(self):
        data = self.get_valid_data()
        data["spaceIds"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Wrong type of id: b for space_ids"
        )

    def test_create_errors_on_wrong_type_of_resource_id(self):
        data = self.get_valid_data()
        data["resourceIds"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Wrong type of id: b for resource_ids"
        )

    def test_create_errors_on_reservation_unit_type(self):
        data = self.get_valid_data()
        data.pop("reservationUnitTypeId")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft reservation unit must have a reservation unit type."
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_wrong_reservation_unit_type(self):
        data = self.get_valid_data()
        data["reservationUnitTypeId"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_with_multiple_spaces(self):
        space_too = SpaceFactory()
        data = self.get_valid_data()
        data["spaceIds"] = [self.space.id, space_too.id]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("id"))
        assert_that(list(res_unit.spaces.all().values_list("id", flat=True))).is_in(
            data.get("spaceIds")
        )

    def test_create_with_multiple_purposes(self):
        purposes = PurposeFactory.create_batch(5)
        data = self.get_valid_data()
        data["purposeIds"] = [purpose.id for purpose in purposes]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("id"))
        assert_that(list(res_unit.purposes.all().values_list("id", flat=True))).is_in(
            data.get("purposeIds")
        )

    def test_create_errors_on_wrong_type_of_purpose_id(self):
        data = self.get_valid_data()
        data["purposeIds"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Wrong type of id: b for purpose_ids"
        )

    def test_create_with_multiple_services(self):
        purposes = ServiceFactory.create_batch(5)
        data = self.get_valid_data()
        data["serviceIds"] = [purpose.id for purpose in purposes]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("id"))
        assert_that(list(res_unit.services.all().values_list("id", flat=True))).is_in(
            data.get("serviceIds")
        )

    def test_create_errors_on_wrong_type_of_service_id(self):
        data = self.get_valid_data()
        data["serviceIds"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Wrong type of id: b for service_ids"
        )

    def test_create_with_multiple_resources(self):
        resource = ResourceFactory()
        data = self.get_valid_data()
        data["resourceIds"] = [self.resource.id, resource.id]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("id"))
        assert_that(list(res_unit.resources.all().values_list("id", flat=True))).is_in(
            data.get("resourceIds")
        )

    def test_create_with_multiple_equipments(self):
        equipments = EquipmentFactory.create_batch(5)
        data = self.get_valid_data()
        data["equipmentIds"] = [equipment.id for equipment in equipments]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("id"))
        assert_that(list(res_unit.equipments.all().values_list("id", flat=True))).is_in(
            data.get("equipmentIds")
        )

    def test_create_errors_on_wrong_type_of_equipment_id(self):
        data = self.get_valid_data()
        data["equipmentIds"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Wrong type of id: b for equipment_ids"
        )

    def test_regular_user_cannot_create(self):
        self._client.force_login(self.regular_joe)
        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_none()


class ReservationUnitUpdateDraftTestCase(ReservationUnitMutationsTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.res_unit = ReservationUnitFactory(
            is_draft=True,
            name="Resunit name",
            unit=cls.unit,
        )

    def get_update_query(self):
        return """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input){
                    id
                    errors {
                        messages field
                    }
                }
            }
            """

    def get_valid_update_data(self):
        return {"pk": self.res_unit.pk}

    def test_update(self):
        data = self.get_valid_update_data()
        data["nameFi"] = "New name"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_fi).is_equal_to("New name")

    def test_update_errors_with_empty_name(self):
        data = self.get_valid_update_data()
        data["nameFi"] = ""

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "nameFi (or name) is required for draft reservation units"
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_fi).is_not_empty()

    def test_errors_with_empty_unit_id(self):
        data = self.get_valid_update_data()
        data["unitId"] = " "

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.unit).is_not_none()

    def test_regular_user_cannot_update(self):
        self._client.force_login(self.regular_joe)
        data = self.get_valid_update_data()
        data["name"] = "Better name in my opinion."
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name).is_equal_to("Resunit name")


class ReservationUnitUpdateNotDraftTestCase(ReservationUnitMutationsTestCaseBase):
    """For published resunits"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.res_unit = ReservationUnitFactory(
            is_draft=False,
            name="Resunit name",
            name_fi="Resunit name",
            name_en="Resunit name",
            name_sv="Resunit name",
            description="Desc",
            description_fi="Desc",
            description_en="Desc",
            description_sv="Desc",
            reservation_unit_type=cls.reservation_unit_type,
            unit=cls.unit,
        )
        cls.res_unit.spaces.add(cls.space)
        cls.res_unit.resources.add(cls.resource)

    def get_update_query(self):
        return """
        mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
            updateReservationUnit(input: $input){
                id
                errors {
                    messages field
                }
            }
        }
        """

    def get_valid_update_data(self):
        return {"pk": self.res_unit.pk}

    def test_update(self):
        data = self.get_valid_update_data()
        data["nameFi"] = "New name"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_fi).is_equal_to("New name")

    def test_errors_on_empty_name_translations(self):
        data = self.get_valid_update_data()
        data["nameEn"] = ""

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_en).is_not_empty()

    def test_errors_on_empty_description_translations(self):
        data = self.get_valid_update_data()
        data["descriptionEn"] = ""

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation units must have a translations."
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.description_en).is_not_empty()

    def test_errors_on_empty_space_and_resource(self):
        data = self.get_valid_update_data()
        data["spaceIds"] = []
        data["resourceIds"] = []

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Not draft state reservation unit must have one or more space or resource defined"
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.spaces.exists()).is_true()
        assert_that(self.res_unit.resources.exists()).is_true()

    def test_errors_on_empty_type(self):
        data = self.get_valid_update_data()
        data["reservationUnitTypeId"] = ""

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_unit_type).is_not_none()

    def test_regular_user_cannot_update(self):
        self._client.force_login(self.regular_joe)
        data = self.get_valid_update_data()
        data["name"] = "Better name in my opinion."
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name).is_equal_to("Resunit name")
