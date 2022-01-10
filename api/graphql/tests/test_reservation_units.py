import datetime
import json
from decimal import Decimal
from unittest import mock

import snapshottest
from assertpy import assert_that
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time
from rest_framework.test import APIClient

from api.graphql.tests.base import GrapheneTestCaseBase
from applications.tests.factories import ApplicationRoundFactory
from opening_hours.enums import State
from opening_hours.errors import HaukiAPIError
from opening_hours.hours import TimeElement
from opening_hours.resources import Resource as HaukiResource
from permissions.models import (
    GeneralRoleChoice,
    GeneralRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.models import ReservationUnit, TaxPercentage
from reservation_units.tests.factories import (
    EquipmentFactory,
    KeywordCategoryFactory,
    KeywordGroupFactory,
    PurposeFactory,
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
)
from reservations.models import STATE_CHOICES
from reservations.tests.factories import (
    ReservationFactory,
    ReservationMetadataSetFactory,
)
from resources.tests.factories import ResourceFactory
from services.tests.factories import ServiceFactory
from spaces.tests.factories import SpaceFactory, UnitFactory
from terms_of_use.models import TermsOfUse
from terms_of_use.tests.factories import TermsOfUseFactory

DEFAULT_TIMEZONE = get_default_timezone()


class ReservationUnitQueryTestCaseBase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.type = ReservationUnitTypeFactory(
            name="test type fi",
            name_fi="test type fi",
            name_en="test type en",
            name_sv="test type sv",
        )
        large_space = SpaceFactory(
            max_persons=100, name="Large space", surface_area=100
        )
        small_space = SpaceFactory(max_persons=10, name="Small space", surface_area=50)
        rule = ReservationUnitCancellationRuleFactory(
            name_fi="fi", name_en="en", name_sv="sv"
        )
        cls.reservation_unit = ReservationUnitFactory(
            name="test name fi",
            name_fi="test name fi",
            name_en="test name en",
            name_sv="test name sv",
            unit=UnitFactory(
                name="test unit fi",
                name_fi="test unit fi",
                name_en="test unit en",
                name_sv="test unit sv",
            ),
            reservation_unit_type=cls.type,
            uuid="3774af34-9916-40f2-acc7-68db5a627710",
            spaces=[large_space, small_space],
            cancellation_rule=rule,
            additional_instructions_fi="Lisäohjeita",
            additional_instructions_sv="Ytterligare instruktioner",
            additional_instructions_en="Additional instructions",
            tax_percentage=TaxPercentage.objects.get(value=24),
            lowest_price=0,
            highest_price=20,
            price_unit=ReservationUnit.PRICE_UNIT_PER_HOUR,
            is_draft=False,
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_30_MINUTES,
            reservation_begins=datetime.datetime.now(),
            reservation_ends=datetime.datetime.now(),
            publish_begins=datetime.datetime.now(),
            publish_ends=datetime.datetime.now(),
            buffer_time_before=datetime.timedelta(minutes=15),
            buffer_time_after=datetime.timedelta(minutes=15),
            metadata_set=ReservationMetadataSetFactory(name="Test form"),
            max_reservations_per_user=5,
        )

        cls.api_client = APIClient()

    def content_is_empty(self, content):
        return len(content["data"]["reservationUnits"]["edges"]) == 0


@freeze_time("2021-05-03")
class ReservationUnitQueryTestCase(ReservationUnitQueryTestCaseBase):
    def test_getting_reservation_units(self):
        self.maxDiff = None
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            descriptionFi
                            spaces {
                              nameFi
                            }
                            resources {
                              nameFi
                            }
                            services {
                              nameFi
                            }
                            requireIntroduction
                            purposes {
                              nameFi
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
                            surfaceArea
                            reservationUnitType {
                              nameFi
                            }
                            termsOfUseFi
                            equipment {
                              nameFi
                            }
                            contactInformationFi
                            additionalInstructionsFi
                            additionalInstructionsSv
                            additionalInstructionsEn
                            reservations {
                              begin
                              end
                              state
                            }
                            applicationRounds {
                              nameFi
                              targetGroup
                              allocating
                              applicationPeriodBegin
                              applicationPeriodEnd
                              reservationPeriodBegin
                              reservationPeriodEnd
                              publicDisplayBegin
                              publicDisplayEnd
                              criteriaFi
                            }
                            cancellationRule {
                                nameFi
                                nameEn
                                nameSv
                            }
                            lowestPrice
                            highestPrice
                            priceUnit
                            reservationStartInterval
                            taxPercentage {
                                value
                            }
                            reservationBegins
                            reservationEnds
                            publishBegins
                            publishEnds
                            bufferTimeBefore
                            bufferTimeAfter
                            metadataSet {
                              name
                              supportedFields
                              requiredFields
                            }
                            maxReservationsPerUser
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
            f"id nameFi pk\n"
            f"}}"
            f"}}"
        )
        response = self.query(query)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("reservationUnitByPk").get("pk")
        ).is_equal_to(self.reservation_unit.id)

    def test_getting_hauki_url_is_none_when_regular_user(self):
        settings.HAUKI_SECRET = "HAUKISECRET"
        settings.HAUKI_ADMIN_UI_URL = "https://test.com"
        settings.HAUKI_ORIGIN_ID = "origin"
        self.reservation_unit.unit.tprek_department_id = "ORGANISATION"
        self.reservation_unit.unit.save()
        self.maxDiff = None
        self.client.force_login(self.regular_joe)
        query = (
            """
            query {
                reservationUnitByPk(pk: %i) {
                    nameFi
                    haukiUrl {url}
                }
            }
            """
            % self.reservation_unit.id
        )
        response = self.query(query)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_hauki_url_for_admin(self):
        settings.HAUKI_SECRET = "HAUKISECRET"
        settings.HAUKI_ADMIN_UI_URL = "https://test.com"
        settings.HAUKI_ORIGIN_ID = "origin"
        self.reservation_unit.unit.tprek_department_id = "ORGANISATION"
        self.reservation_unit.unit.save()
        self.maxDiff = None
        gen_role_choice = GeneralRoleChoice.objects.get(code="admin")
        GeneralRolePermission.objects.create(
            role=gen_role_choice, permission="can_manage_units"
        )
        self.client.force_login(self.general_admin)
        query = (
            """
                query {
                    reservationUnitByPk(pk: %i) {
                        nameFi
                        haukiUrl {url}
                    }
                }
                """
            % self.reservation_unit.id
        )
        response = self.query(query)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_hauki_url_for_unit_manager(self):
        settings.HAUKI_SECRET = "HAUKISECRET"
        settings.HAUKI_ADMIN_UI_URL = "https://test.com"
        settings.HAUKI_ORIGIN_ID = "origin"
        self.reservation_unit.unit.tprek_department_id = "ORGANISATION"
        self.reservation_unit.unit.save()
        self.maxDiff = None
        unit_manager = get_user_model().objects.create(
            username="res_admin",
            first_name="unit",
            last_name="adm",
            email="unit.admin@foo.com",
        )
        unit_role_choice = UnitRoleChoice.objects.get(code="manager")
        UnitRole.objects.create(
            user=unit_manager, role=unit_role_choice, unit=self.reservation_unit.unit
        )
        UnitRolePermission.objects.create(
            role=unit_role_choice, permission="can_manage_units"
        )
        self.client.force_login(unit_manager)
        query = (
            """
                query {
                    reservationUnitByPk(pk: %i) {
                        nameFi
                        haukiUrl {url}
                    }
                }
                """
            % self.reservation_unit.id
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
    @mock.patch("opening_hours.hours.make_hauki_get_request")
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
            f"{{openingTimes{{date startTime endTime}} openingTimePeriods{{timeSpans{{startTime}}}}"
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
        assert_that(
            content.get("data")
            .get("reservationUnitByPk")
            .get("openingHours")
            .get("openingTimes")[0]["startTime"]
        ).is_equal_to("10:00:00+00:00")
        assert_that(
            content.get("data")
            .get("reservationUnitByPk")
            .get("openingHours")
            .get("openingTimes")[0]["endTime"]
        ).is_equal_to("22:00:00+00:00")

    def test_filtering_by_unit(self):
        ReservationUnitFactory(unit=UnitFactory())  # should be excluded
        response = self.query(
            f"""
            query {{
                reservationUnits(unit: {self.reservation_unit.unit.pk}) {{
                    edges {{
                        node {{
                            nameFi
                            unit {{
                                nameFi
                            }}
                        }}
                    }}
                }}
            }}
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_multiple_units(self):
        ReservationUnitFactory(unit=UnitFactory())  # should be excluded
        other_unit = UnitFactory(name_fi="Other unit")
        ReservationUnitFactory(name_fi="Other reservation unit", unit=other_unit)
        response = self.query(
            f"""
            query {{
                reservationUnits(unit: [{self.reservation_unit.unit.pk},{other_unit.pk}]) {{
                    edges {{
                        node {{
                            nameFi
                            unit {{
                                nameFi
                            }}
                        }}
                    }}
                }}
            }}
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_type(self):
        response = self.query(
            f"query {{"
            f"reservationUnits(reservationUnitType:{self.type.id}){{"
            f"edges {{"
            f"node {{"
            f"nameFi "
            f"reservationUnitType {{"
            f"nameFi"
            f"}}"
            f"}}"
            f"}}"
            f"}}"
            f"}}"
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_multiple_types(self):
        ReservationUnitFactory(unit=UnitFactory())  # should be excluded
        other_type = ReservationUnitTypeFactory(name="Other type")
        ReservationUnitFactory(
            name="Other reservation unit",
            reservation_unit_type=other_type,
            uuid="25455dc2-5383-426d-b711-97b241710ace",
            is_draft=True,
        )
        response = self.query(
            f"""
            query {{
                reservationUnits(reservationUnitType: [{self.type.id},{other_type.id}]) {{
                    edges {{
                        node {{
                            nameFi
                            reservationUnitType {{
                                nameFi
                            }}
                        }}
                    }}
                }}
            }}
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_purpose(self):
        purpose = PurposeFactory(name="Test purpose")
        self.reservation_unit.purposes.set([purpose])
        response = self.query(
            f"""
            query {{
                reservationUnits(purposes: {purpose.pk}) {{
                    edges {{
                        node {{
                            nameFi purposes {{
                                nameFi
                            }}
                        }}
                    }}
                }}
            }}
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_multiple_purposes(self):
        excluded = ReservationUnitFactory()  # should be excluded
        excluded.purposes.set([PurposeFactory()])
        purpose = PurposeFactory(name="Test purpose")
        other_purpose = PurposeFactory(name="Other purpose")
        self.reservation_unit.purposes.set([purpose])
        response = self.query(
            f"""
            query {{
                reservationUnits(purposes: [{purpose.pk},{other_purpose.pk}]) {{
                    edges {{
                        node {{
                            nameFi
                            purposes {{
                                nameFi
                            }}
                        }}
                    }}
                }}
            }}
            """
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
                        nameFi
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
                            nameFi maxPersons
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
                            nameFi maxPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

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
            f"nameFi\n"
            f"keywordGroups{{nameFi}}"
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
            f"nameFi\n"
            f"keywordGroups{{nameFi}}"
            f"}}"
            f"}}"
            f"}}"
            f"}}"
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_empty()

    def test_filtering_by_multiple_keyword_groups(self):
        category = KeywordCategoryFactory()
        excluded = ReservationUnitFactory()  # should be excluded
        excluded.keyword_groups.set([KeywordGroupFactory(keyword_category=category)])
        keyword_group = KeywordGroupFactory(
            name="Test group", keyword_category=category
        )
        other_keyword_group = KeywordGroupFactory(
            name="Other group", keyword_category=category
        )
        self.reservation_unit.keyword_groups.set([keyword_group])
        response = self.query(
            f"""
            query {{
                reservationUnits(keywordGroups: [{keyword_group.pk},{other_keyword_group.pk}]) {{
                    edges {{
                        node {{
                            nameFi
                            keywordGroups {{
                                nameFi
                            }}
                        }}
                    }}
                }}
            }}
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_reservation_timestamps(self):
        now = datetime.datetime.now().astimezone()
        one_hour = datetime.timedelta(hours=1)
        matching_reservation = ReservationFactory(
            begin=now,
            end=now + one_hour,
            state=STATE_CHOICES.CREATED,
        )
        other_reservation = ReservationFactory(
            begin=datetime.datetime(2021, 1, 1),
            end=datetime.datetime(2021, 1, 2),
        )
        self.reservation_unit.reservation_set.set(
            [matching_reservation, other_reservation]
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            reservations(from: "2021-05-03", to: "2021-05-04") {
                                begin
                                end
                                state
                            }
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

    def test_filtering_by_reservation_state(self):
        now = datetime.datetime.now().astimezone()
        one_hour = datetime.timedelta(hours=1)
        matching_reservation = ReservationFactory(
            begin=now,
            end=now + one_hour,
            state=STATE_CHOICES.CREATED,
        )
        other_reservation = ReservationFactory(
            begin=now + one_hour,
            end=now + one_hour + one_hour,
            state=STATE_CHOICES.CANCELLED,
        )
        self.reservation_unit.reservation_set.set(
            [matching_reservation, other_reservation]
        )
        self.reservation_unit.save()
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            reservations(state: "created") {
                                begin
                                end
                                state
                            }
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

    def test_filtering_by_multiple_reservation_states(self):
        now = datetime.datetime.now().astimezone()
        one_hour = datetime.timedelta(hours=1)
        two_hours = datetime.timedelta(hours=2)
        matching_reservations = [
            ReservationFactory(
                begin=now, end=now + one_hour, state=STATE_CHOICES.CREATED
            ),
            ReservationFactory(
                begin=now + one_hour, end=now + two_hours, state=STATE_CHOICES.CONFIRMED
            ),
        ]
        other_reservation = ReservationFactory(
            begin=now + two_hours,
            end=now + two_hours + one_hour,
            state=STATE_CHOICES.CANCELLED,
        )
        self.reservation_unit.reservation_set.set(
            matching_reservations + [other_reservation]
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            reservations(state: ["created", "confirmed"]) {
                                begin
                                end
                                state
                            }
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

    def test_filtering_by_active_application_rounds(self):
        now = datetime.datetime.now().astimezone()
        one_hour = datetime.timedelta(hours=1)
        matching_round = ApplicationRoundFactory(
            name="Test Round",
            application_period_begin=now - one_hour,
            application_period_end=now + one_hour,
        )
        other_round = ApplicationRoundFactory(
            application_period_begin=datetime.datetime(2021, 1, 1, 12).astimezone(),
            application_period_end=datetime.datetime(2021, 1, 1, 13).astimezone(),
        )
        self.reservation_unit.application_rounds.set([matching_round, other_round])
        self.reservation_unit.save()
        response = self.query(
            """
            query {
              reservationUnits {
                edges {
                  node {
                    applicationRounds(active: true) {
                      nameFi
                    }
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

    def test_filtering_by_is_draft_true(self):
        ReservationUnitFactory(
            name="Draft reservation unit",
            is_draft=True,
        )
        response = self.query(
            """
            query {
                reservationUnits(isDraft: true) {
                    edges {
                        node {
                            nameFi
                            isDraft
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_is_draft_false(self):
        response = self.query(
            """
            query {
                reservationUnits(isDraft: false) {
                    edges {
                        node {
                            nameFi
                            isDraft
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_name_fi(self):
        ReservationUnitFactory(
            name="name_fi",
            name_fi="name_fi",
        )
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "nameFi") {
                    edges {
                        node {
                            nameFi
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_name_en(self):
        ReservationUnitFactory(
            name="name_en",
            name_en="name_en",
        )
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "nameEn") {
                    edges {
                        node {
                            nameEn
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_name_sv(self):
        ReservationUnitFactory(
            name="name_sv",
            name_sv="name_sv",
        )
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "nameSv") {
                    edges {
                        node {
                            nameSv
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_type_fi(self):
        self.maxDiff = None
        res_type = ReservationUnitTypeFactory(name="name_fi", name_fi="name_fi")
        ReservationUnitFactory(
            reservation_unit_type=res_type,
        )
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "typeFi") {
                    edges {
                        node {
                            reservationUnitType {nameFi}
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_type_en(self):
        res_type = ReservationUnitTypeFactory(name="name_en", name_fi="name_en")
        ReservationUnitFactory(
            reservation_unit_type=res_type,
        )
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "typeEn") {
                    edges {
                        node {
                            reservationUnitType {nameEn}
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_type_sv(self):
        res_type = ReservationUnitTypeFactory(name="name_sv", name_fi="name_sv")
        ReservationUnitFactory(
            reservation_unit_type=res_type,
        )
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "typeSv") {
                    edges {
                        node {
                            reservationUnitType {nameSv}
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_unit(self):
        unit = UnitFactory(name="testunit", name_fi="testunit")
        ReservationUnitFactory(
            unit=unit,
        )
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "unit") {
                    edges {
                        node {
                            unit {nameFi}
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_unit_reverse_order(self):
        unit = UnitFactory(name="testunit", name_fi="testunit")
        ReservationUnitFactory(
            unit=unit,
        )
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "-unit") {
                    edges {
                        node {
                            unit {nameFi}
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_getting_manually_given_surface_area(self):
        self.reservation_unit.surface_area = 500
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            surfaceArea
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

    def test_getting_terms(self):
        self.reservation_unit.payment_terms = TermsOfUseFactory(
            text_fi="Payment terms", terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION
        )
        self.reservation_unit.cancellation_terms = TermsOfUseFactory(
            text_fi="Cancellation terms", terms_type=TermsOfUse.TERMS_TYPE_PAYMENT
        )
        self.reservation_unit.service_specific_terms = TermsOfUseFactory(
            text_fi="Service-specific terms", terms_type=TermsOfUse.TERMS_TYPE_SERVICE
        )
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            paymentTerms { textFi }
                            cancellationTerms { textFi }
                            serviceSpecificTerms { textFi }
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


class ReservationUnitsFilterTextSearchTestCase(ReservationUnitQueryTestCaseBase):
    def test_filtering_by_type_fi(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test type fi"){
                    edges {
                        node {
                            nameFi
                            reservationUnitType {
                                nameFi
                            }
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
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_type_en(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test type en"){
                    edges {
                        node {
                            nameFi
                            reservationUnitType {
                                nameEn
                            }
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

    def test_filtering_by_type_sv(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test type sv"){
                    edges {
                        node {
                            nameFi
                            reservationUnitType {
                                nameSv
                            }
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

    def test_filtering_by_reservation_unit_name_fi(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test name fi"){
                    edges {
                        node {
                            nameFi
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
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_reservation_unit_name_en(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test name en"){
                    edges {
                        node {
                            nameEn
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

    def test_filtering_by_reservation_unit_name_sv(self):
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Test name sv"){
                    edges {
                        node {
                            nameSv
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

    def test_filtering_by_reservation_unit_description_fi(self):
        self.reservation_unit.description_fi = "Lorem ipsum fi"
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Lorem ipsum fi"){
                    edges {
                        node {
                            nameFi
                            descriptionFi
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
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_reservation_unit_description_en(self):
        self.reservation_unit.description_en = "Lorem ipsum en"
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Lorem ipsum en"){
                    edges {
                        node {
                            nameFi
                            descriptionEn
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

    def test_filtering_by_reservation_unit_description_sv(self):
        self.reservation_unit.description_sv = "Lorem ipsum sv"
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits(textSearch:"Lorem ipsum sv"){
                    edges {
                        node {
                            nameFi
                            descriptionFi
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

    def test_filtering_by_space_name_fi(self):
        space = SpaceFactory(name="space name fi")
        self.reservation_unit.spaces.set([space])
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"space name fi"){
                    edges {
                        node {
                            nameFi
                            spaces{nameFi}
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
                            nameFi
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()

    def test_filtering_by_space_name_en(self):
        space = SpaceFactory(name_en="space name en")
        self.reservation_unit.spaces.set([space])
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"space name en"){
                    edges {
                        node {
                            nameFi
                            spaces{nameEn}
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

    def test_filtering_by_space_name_sv(self):
        space = SpaceFactory(name_sv="space name sv")
        self.reservation_unit.spaces.set([space])
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits(textSearch:"space name sv"){
                    edges {
                        node {
                            nameFi
                            spaces{nameSv}
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


def get_mocked_opening_hours(uuid):
    resource_id = f"{settings.HAUKI_ORIGIN_ID}:{uuid}"
    return [
        {
            "timezone": DEFAULT_TIMEZONE,
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
            "timezone": DEFAULT_TIMEZONE,
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
        cls.rule = ReservationUnitCancellationRuleFactory(
            name_fi="fi",
            name_en="en",
            name_sv="sv",
        )
        cls.metadata_set = ReservationMetadataSetFactory(name="Test form")

    def setUp(self):
        self.client.force_login(self.general_admin)


class ReservationUnitCreateAsDraftTestCase(ReservationUnitMutationsTestCaseBase):
    def get_create_query(self):
        return """
        mutation createReservationUnit($input: ReservationUnitCreateMutationInput!) {
            createReservationUnit(input: $input){
                pk
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
            "unitPk": self.unit.pk,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORT_ENABLED=True)
    def test_send_resource_to_hauki_is_not_called(self, send_resource_mock):
        data = {
            "isDraft": True,
            "nameFi": "Resunit name",
            "nameEn": "English name",
            "descriptionFi": "desc",
            "unitPk": self.unit.pk,
        }

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(0)

    def test_create_errors_without_unit_pk(self):
        data = {"isDraft": True, "nameFi": "Resunit name"}
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
            "unitPk": self.unit.id,
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
            "unitPk": self.unit.id,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))

    def test_create_without_is_draft_with_name_and_unit_fails(self):
        data = {
            "nameFi": "Resunit name",
            "unitPk": self.unit.id,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        data = {"isDraft": True, "nameFi": "Resunit name", "unitPk": self.unit.id}
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
                pk
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
            "termsOfUseFi": "termsFi",
            "termsOfUseEn": "termsEn",
            "termsOfUseSv": "termsSv",
            "contactInformationFi": "contactFi",
            "contactInformationEn": "contactEn",
            "contactInformationSv": "contactSv",
            "spacePks": [self.space.id],
            "resourcePks": [self.resource.id],
            "servicePks": [self.service.id],
            "unitPk": self.unit.id,
            "reservationUnitTypePk": self.reservation_unit_type.id,
            "surfaceArea": 100,
            "maxPersons": 10,
            "bufferTimeAfter": "1:00:00",
            "bufferTimeBefore": "1:00:00",
            "cancellationRulePk": self.rule.pk,
            "lowestPrice": 0,
            "highestPrice": 20,
            "priceUnit": ReservationUnit.PRICE_UNIT_PER_HOUR.upper(),
            "reservationStartInterval": ReservationUnit.RESERVATION_START_INTERVAL_60_MINUTES.upper(),
            "taxPercentagePk": TaxPercentage.objects.get(value=24).pk,
            "publishBegins": "2021-05-03T00:00:00+00:00",
            "publishEnds": "2021-05-03T00:00:00+00:00",
            "reservationBegins": "2021-05-03T00:00:00+00:00",
            "reservationEnds": "2021-05-03T00:00:00+00:00",
            "metadataSetPk": self.metadata_set.pk,
            "maxReservationsPerUser": 2,
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
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
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
        assert_that(res_unit.buffer_time_after).is_equal_to(datetime.timedelta(hours=1))
        assert_that(res_unit.buffer_time_before).is_equal_to(
            datetime.timedelta(hours=1)
        )
        assert_that(res_unit.cancellation_rule).is_equal_to(self.rule)
        assert_that(res_unit.lowest_price).is_equal_to(data.get("lowestPrice"))
        assert_that(res_unit.highest_price).is_equal_to(data.get("highestPrice"))
        assert_that(res_unit.price_unit.upper()).is_equal_to(data.get("priceUnit"))
        assert_that(res_unit.reservation_start_interval.upper()).is_equal_to(
            data.get("reservationStartInterval")
        )
        assert_that(res_unit.tax_percentage).is_equal_to(
            TaxPercentage.objects.get(value=24)
        )
        publish_begins = datetime.datetime.fromisoformat(data.get("publishBegins"))
        assert_that(res_unit.publish_begins).is_equal_to(publish_begins)
        publish_ends = datetime.datetime.fromisoformat(data.get("publishEnds"))
        assert_that(res_unit.publish_ends).is_equal_to(publish_ends)
        reservation_begins = datetime.datetime.fromisoformat(
            data.get("reservationBegins")
        )
        assert_that(res_unit.reservation_begins).is_equal_to(reservation_begins)
        reservation_ends = datetime.datetime.fromisoformat(
            data.get("reservationBegins")
        )
        assert_that(res_unit.reservation_ends).is_equal_to(reservation_ends)
        assert_that(res_unit.metadata_set).is_equal_to(self.metadata_set)
        assert_that(res_unit.max_reservations_per_user).is_equal_to(
            data.get("maxReservationsPerUser")
        )

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called(self, send_resource_mock):
        res = HaukiResource(
            id=1,
            name="",
            description="",
            address=None,
            origin_data_source_name="Tilavarauspalvelu",
            origin_data_source_id="tvp",
            origin_id="",
            organization="department_id",
            parents=[],
            children=[],
            resource_type="",
        )
        send_resource_mock.return_value = res

        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(1)

    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    def test_send_resource_to_hauki_errors_returns_error_message(
        self, send_resource_mock
    ):
        send_resource_mock.side_effect = HaukiAPIError()

        data = self.get_valid_data()
        response = self.query(self.get_create_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Sending reservation unit as resource to HAUKI failed."
        )
        assert_that(send_resource_mock.call_count).is_equal_to(1)
        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit.hauki_resource_id).is_none()

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

    def test_create_errors_without_unit_pk(self):
        data = self.get_valid_data()
        data.pop("unitPk")

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_create_errors_on_empty_space_and_missing_resource(self):
        data = self.get_valid_data()
        data.pop("resourcePks")
        data["spacePks"] = []

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
        data.pop("spacePks")
        data["resourcePks"] = []

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
        data["resourcePks"] = []
        data["spacePks"] = []

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
        data.pop("resourcePks")
        data.pop("spacePks")

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

    def test_create_errors_on_wrong_type_of_space_pk(self):
        data = self.get_valid_data()
        data["spacePks"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_errors_on_wrong_type_of_resource_pk(self):
        data = self.get_valid_data()
        data["resourcePks"] = "b"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_errors_on_reservation_unit_type(self):
        data = self.get_valid_data()
        data.pop("reservationUnitTypePk")

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
        data["reservationUnitTypePk"] = -15

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
        data["spacePks"] = [self.space.id, space_too.id]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.spaces.all().values_list("id", flat=True))).is_in(
            data.get("spacePks")
        )

    def test_create_with_multiple_purposes(self):
        purposes = PurposeFactory.create_batch(5)
        data = self.get_valid_data()
        data["purposePks"] = [purpose.id for purpose in purposes]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.purposes.all().values_list("id", flat=True))).is_in(
            data.get("purposePks")
        )

    def test_create_errors_on_wrong_type_of_purpose_pk(self):
        data = self.get_valid_data()
        data["purposePks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_with_multiple_services(self):
        purposes = ServiceFactory.create_batch(5)
        data = self.get_valid_data()
        data["servicePks"] = [purpose.id for purpose in purposes]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.services.all().values_list("id", flat=True))).is_in(
            data.get("servicePks")
        )

    def test_create_errors_on_wrong_type_of_service_pk(self):
        data = self.get_valid_data()
        data["servicePks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_create_with_multiple_resources(self):
        resource = ResourceFactory()
        data = self.get_valid_data()
        data["resourcePks"] = [self.resource.id, resource.id]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.resources.all().values_list("id", flat=True))).is_in(
            data.get("resourcePks")
        )

    def test_create_with_multiple_equipments(self):
        equipments = EquipmentFactory.create_batch(5)
        data = self.get_valid_data()
        data["equipmentPks"] = [equipment.id for equipment in equipments]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.equipments.all().values_list("id", flat=True))).is_in(
            data.get("equipmentPks")
        )

    def test_create_errors_on_wrong_type_of_equipment_pk(self):
        data = self.get_valid_data()
        data["equipmentPks"] = ["b"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(400)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
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
                    pk
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

    def test_update_with_tax_percentage(self):
        tax_percentage = TaxPercentage.objects.first()
        data = self.get_valid_update_data()
        data["taxPercentagePk"] = tax_percentage.pk
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.tax_percentage).is_equal_to(tax_percentage)

    def test_update_with_metadata_set(self):
        metadata_set = ReservationMetadataSetFactory(name="New form")
        data = self.get_valid_update_data()
        data["metadataSetPk"] = metadata_set.pk
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.metadata_set).is_equal_to(metadata_set)

    def test_update_with_null_metadata_set(self):
        data = self.get_valid_update_data()
        data["metadataSetPk"] = None
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.metadata_set).is_none()

    def test_update_with_terms_of_use_pks(self):
        payment_terms = TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PAYMENT)
        cancellation_terms = TermsOfUseFactory(
            terms_type=TermsOfUse.TERMS_TYPE_CANCELLATION
        )
        service_specific_terms = TermsOfUseFactory(
            terms_type=TermsOfUse.TERMS_TYPE_SERVICE
        )
        data = self.get_valid_update_data()
        data["paymentTermsPk"] = payment_terms.pk
        data["cancellationTermsPk"] = cancellation_terms.pk
        data["serviceSpecificTermsPk"] = service_specific_terms.pk
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.payment_terms).is_equal_to(payment_terms)
        assert_that(self.res_unit.cancellation_terms).is_equal_to(cancellation_terms)
        assert_that(self.res_unit.service_specific_terms).is_equal_to(
            service_specific_terms
        )

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
            "nameFi is required for draft reservation units"
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name_fi).is_not_empty()

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        data = self.get_valid_update_data()
        data["nameFi"] = "Better name in my opinion."
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name).is_equal_to("Resunit name")

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called_when_resource_id_exists(
        self, send_resource_mock
    ):
        self.res_unit.hauki_resource_id = "1"
        self.res_unit.save()

        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(1)

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=False)
    def test_send_resource_to_hauki_not_called_when_exports_disabled(
        self, send_resource_mock
    ):
        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(0)


class ReservationUnitUpdateNotDraftTestCase(ReservationUnitMutationsTestCaseBase):
    """For published resunits"""

    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.res_unit = ReservationUnitFactory(
            is_draft=False,
            name_fi="Resunit name",
            name_en="Resunit name",
            name_sv="Resunit name",
            description_fi="Desc",
            description_en="Desc",
            description_sv="Desc",
            terms_of_use_fi="Terms",
            terms_of_use_sv="Terms",
            terms_of_use_en="Terms",
            contact_information_fi="Info",
            contact_information_sv="Info",
            contact_information_en="Info",
            reservation_unit_type=cls.reservation_unit_type,
            unit=cls.unit,
        )
        cls.res_unit.spaces.add(cls.space)
        cls.res_unit.resources.add(cls.resource)

    def setUp(self):
        super().setUp()
        self.res_unit.hauki_resource_id = None
        self.res_unit.save()

    def get_update_query(self):
        return """
        mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
            updateReservationUnit(input: $input){
                pk
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

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called_when_no_resource_id(
        self, send_resource_mock
    ):
        res = HaukiResource(
            id=1,
            name="",
            description="",
            address=None,
            origin_data_source_name="Tilavarauspalvelu",
            origin_data_source_id="tvp",
            origin_id="",
            organization="department_id",
            parents=[],
            children=[],
            resource_type="",
        )
        send_resource_mock.return_value = res

        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(1)

    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    def test_send_resource_to_hauki_called_when_resource_id_exists(
        self, send_resource_mock
    ):
        self.res_unit.hauki_resource_id = "1"
        self.res_unit.save()

        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(send_resource_mock.call_count).is_equal_to(1)

    @override_settings(HAUKI_EXPORTS_ENABLED=True)
    @mock.patch(
        "reservation_units.utils.hauki_exporter.ReservationUnitHaukiExporter.send_reservation_unit_to_hauki"
    )
    def test_send_resource_to_hauki_errors_returns_error_message(
        self, send_resource_mock
    ):
        send_resource_mock.side_effect = HaukiAPIError()

        data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "Sending reservation unit as resource to HAUKI failed."
        )
        assert_that(send_resource_mock.call_count).is_equal_to(1)

    def test_update_surface_area(self):
        expected_surface_area = 150
        data = self.get_valid_update_data()
        data["surfaceArea"] = expected_surface_area
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input) {
                    surfaceArea
                    errors {
                        messages
                        field
                    }
                }
            }
        """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(res_unit_data.get("surfaceArea")).is_equal_to(expected_surface_area)
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.surface_area).is_equal_to(expected_surface_area)

    def test_update_additional_instructions(self):
        expected_fi = "Lisätietoja"
        expected_sv = "Ytterligare instruktioner"
        expected_en = "Additional instructions"
        data = self.get_valid_update_data()
        data["additionalInstructionsFi"] = expected_fi
        data["additionalInstructionsSv"] = expected_sv
        data["additionalInstructionsEn"] = expected_en
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input) {
                    additionalInstructionsFi
                    additionalInstructionsSv
                    additionalInstructionsEn
                    errors {
                        messages
                        field
                    }
                }
            }
        """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(res_unit_data.get("additionalInstructionsFi")).is_equal_to(
            expected_fi
        )
        assert_that(res_unit_data.get("additionalInstructionsSv")).is_equal_to(
            expected_sv
        )
        assert_that(res_unit_data.get("additionalInstructionsEn")).is_equal_to(
            expected_en
        )
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.additional_instructions_fi).is_equal_to(expected_fi)
        assert_that(self.res_unit.additional_instructions_sv).is_equal_to(expected_sv)
        assert_that(self.res_unit.additional_instructions_en).is_equal_to(expected_en)

    def test_update_max_reservations_per_user(self):
        expected_max_reservations_per_user = 10
        data = self.get_valid_update_data()
        data["maxReservationsPerUser"] = expected_max_reservations_per_user
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                    updateReservationUnit(input: $input) {
                        maxReservationsPerUser
                        errors {
                            messages
                            field
                        }
                    }
                }
            """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(res_unit_data.get("maxReservationsPerUser")).is_equal_to(
            expected_max_reservations_per_user
        )
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.max_reservations_per_user).is_equal_to(
            expected_max_reservations_per_user
        )

    def test_update_cancellation_rule(self):
        data = self.get_valid_update_data()
        data.update({"cancellationRulePk": self.rule.pk})
        update_query = """
                    mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                        updateReservationUnit(input: $input) {
                            errors {
                                messages
                                field
                            }
                        }
                    }
                """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.cancellation_rule).is_equal_to(self.rule)

    def test_update_cancellation_rule_to_null(self):
        self.res_unit.cancellation_rule = self.rule
        self.res_unit.save()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.cancellation_rule).is_equal_to(self.rule)

        data = self.get_valid_update_data()
        data.update({"cancellationRulePk": None})
        update_query = """
                    mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                        updateReservationUnit(input: $input) {
                            errors {
                                messages
                                field
                            }
                        }
                    }
                """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.cancellation_rule).is_none()

    def test_update_price_fields(self):
        expected_lowest_price = Decimal("0.00")
        expected_highest_price = Decimal("20.00")
        expected_price_unit = ReservationUnit.PRICE_UNIT_PER_HOUR
        data = self.get_valid_update_data()
        data["lowestPrice"] = float(expected_lowest_price)
        data["highestPrice"] = float(expected_highest_price)
        data["priceUnit"] = expected_price_unit.upper()
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input) {
                    lowestPrice
                    highestPrice
                    priceUnit
                    errors {
                        messages
                        field
                    }
                }
            }
        """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(res_unit_data.get("lowestPrice")).is_equal_to(
            float(expected_lowest_price)
        )
        assert_that(res_unit_data.get("highestPrice")).is_equal_to(
            float(expected_highest_price)
        )
        assert_that(res_unit_data.get("priceUnit")).is_equal_to(
            expected_price_unit.upper()
        )
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.lowest_price).is_equal_to(expected_lowest_price)
        assert_that(self.res_unit.highest_price).is_equal_to(expected_highest_price)
        assert_that(self.res_unit.price_unit).is_equal_to(expected_price_unit)

    def test_price_unit_cannot_be_invalid(self):
        invalid_price_unit = "invalid"
        data = self.get_valid_update_data()
        data["priceUnit"] = invalid_price_unit
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.price_unit).is_not_equal_to(invalid_price_unit)

    def test_reservation_start_interval_cannot_be_invalid(self):
        invalid_interval = "invalid"
        data = self.get_valid_update_data()
        data["reservationStartInterval"] = invalid_interval
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_start_interval).is_not_equal_to(
            invalid_interval
        )

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

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.description_en).is_not_empty()

    def test_errors_on_empty_space_and_resource(self):
        data = self.get_valid_update_data()
        data["spacePks"] = []
        data["resourcePks"] = []

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
        data["reservationUnitTypePk"] = None

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_unit_type).is_not_none()

    def test_update_reservation_start_interval(self):
        expected_interval = ReservationUnit.RESERVATION_START_INTERVAL_60_MINUTES
        data = self.get_valid_update_data()
        data["reservationStartInterval"] = expected_interval.upper()
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input) {
                    reservationStartInterval
                    errors {
                        messages
                        field
                    }
                }
            }
        """
        response = self.query(update_query, input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()
        assert_that(res_unit_data.get("reservationStartInterval")).is_equal_to(
            expected_interval.upper()
        )
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_start_interval).is_equal_to(
            expected_interval
        )

    def test_regular_user_cannot_update(self):
        self.client.force_login(self.regular_joe)
        data = self.get_valid_update_data()
        data["nameFi"] = "Better name in my opinion."
        response = self.query(self.get_update_query(), input_data=data)

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.name).is_equal_to("Resunit name")
