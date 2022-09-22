import datetime
import json
from decimal import Decimal
from unittest import mock

import snapshottest
from assertpy import assert_that
from auditlog.models import LogEntry
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
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
    ServiceSectorRole,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRole,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservation_units.models import (
    PaymentType,
    PricingType,
    ReservationKind,
    ReservationUnit,
    TaxPercentage,
)
from reservation_units.tests.factories import (
    EquipmentFactory,
    KeywordCategoryFactory,
    KeywordGroupFactory,
    PurposeFactory,
    QualifierFactory,
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
from spaces.tests.factories import (
    ServiceSectorFactory,
    SpaceFactory,
    UnitFactory,
    UnitGroupFactory,
)
from terms_of_use.models import TermsOfUse
from terms_of_use.tests.factories import TermsOfUseFactory
from tilavarauspalvelu.utils.auditlog_util import AuditLogger

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
        service = ServiceFactory(
            name="Test Service",
            buffer_time_before=datetime.timedelta(minutes=15),
            buffer_time_after=datetime.timedelta(minutes=30),
        )
        large_space = SpaceFactory(
            max_persons=100, name="Large space", surface_area=100
        )
        small_space = SpaceFactory(max_persons=10, name="Small space", surface_area=50)
        rule = ReservationUnitCancellationRuleFactory(
            name_fi="fi", name_en="en", name_sv="sv"
        )

        qualifier = QualifierFactory(name="Test Qualifier")

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
            services=[service],
            cancellation_rule=rule,
            reservation_confirmed_instructions_fi="Hyväksytyn varauksen lisäohjeita",
            reservation_confirmed_instructions_sv="Ytterligare instruktioner för den godkända reservationen",
            reservation_confirmed_instructions_en="Additional instructions for the approved reservation",
            tax_percentage=TaxPercentage.objects.get(value=24),
            lowest_price=0,
            highest_price=20,
            price_unit=ReservationUnit.PRICE_UNIT_PER_HOUR,
            is_draft=False,
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_30_MINUTES,
            reservation_begins=datetime.datetime.now(tz=get_default_timezone()),
            reservation_ends=datetime.datetime.now(tz=get_default_timezone()),
            publish_begins=datetime.datetime.now(tz=get_default_timezone()),
            publish_ends=datetime.datetime.now(tz=get_default_timezone())
            + datetime.timedelta(days=7),
            buffer_time_before=datetime.timedelta(minutes=15),
            buffer_time_after=datetime.timedelta(minutes=15),
            min_reservation_duration=datetime.timedelta(minutes=10),
            max_reservation_duration=datetime.timedelta(days=1),
            metadata_set=ReservationMetadataSetFactory(name="Test form"),
            max_reservations_per_user=5,
            min_persons=10,
            max_persons=200,
            reservations_max_days_before=360,
            reservations_min_days_before=1,
            pricing_terms=TermsOfUseFactory(terms_type=TermsOfUse.TERMS_TYPE_PRICING),
            pricing_type=PricingType.PAID,
        )
        cls.reservation_unit.qualifiers.set([qualifier])
        cls.reservation_unit.payment_types.set([PaymentType.ONLINE])

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
                              bufferTimeBefore
                              bufferTimeAfter
                            }
                            requireIntroduction
                            purposes {
                              nameFi
                            }
                            qualifiers {
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
                            minPersons
                            surfaceArea
                            reservationUnitType {
                              nameFi
                            }
                            termsOfUseFi
                            equipment {
                              nameFi
                            }
                            contactInformation
                            reservationPendingInstructionsFi
                            reservationPendingInstructionsSv
                            reservationPendingInstructionsEn
                            reservationConfirmedInstructionsFi
                            reservationConfirmedInstructionsSv
                            reservationConfirmedInstructionsEn
                            reservationCancelledInstructionsFi
                            reservationCancelledInstructionsSv
                            reservationCancelledInstructionsEn
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
                            minReservationDuration
                            maxReservationDuration
                            metadataSet {
                              name
                              supportedFields
                              requiredFields
                            }
                            maxReservationsPerUser
                            requireReservationHandling
                            authentication
                            reservationKind
                            canApplyFreeOfCharge
                            reservationsMaxDaysBefore
                            reservationsMinDaysBefore
                            allowReservationsWithoutOpeningHours
                            isArchived
                            state
                            pricingTerms {
                                termsType
                            }
                            pricingType
                            paymentTypes {
                                code
                            }
                          }
                        }
                    }
                }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_should_not_return_archived_reservation_units(self):
        ReservationUnitFactory(
            name="I should be hiding",
            is_archived=True,
        )
        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            isArchived
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

    def test_getting_authentication_by_pk(self):
        response = self.query(
            f"""
            {{
                reservationUnitByPk(pk: {self.reservation_unit.id}) {{
                    authentication
                }}
            }}
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("reservationUnitByPk").get("authentication")
        ).is_equal_to("WEAK")

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
        unit_role = UnitRole.objects.create(user=unit_manager, role=unit_role_choice)
        unit_role.unit.add(self.reservation_unit.unit)
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
        ).is_equal_to("08:00:00+00:00")
        assert_that(
            content.get("data")
            .get("reservationUnitByPk")
            .get("openingHours")
            .get("openingTimes")[0]["endTime"]
        ).is_equal_to("20:00:00+00:00")

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

    def test_filtering_by_multiple_application_round(self):
        res_unit = ReservationUnitFactory(name_fi="Reservation unit")
        other_res_unit = ReservationUnitFactory(name_fi="The Other reservation unit")
        ReservationUnitFactory(name_fi="Reservation unit too")
        app_round = ApplicationRoundFactory(reservation_units=[res_unit])
        app_round_too = ApplicationRoundFactory(reservation_units=[other_res_unit])
        response = self.query(
            f"""
            query {{
                reservationUnits(applicationRound: [{app_round.id},{app_round_too.id}]) {{
                    edges {{
                        node {{
                            nameFi
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

    def test_filtering_by_qualifier(self):
        qualifier = QualifierFactory(name="Filter test qualifier")
        self.reservation_unit.qualifiers.set([qualifier])
        response = self.query(
            f"""
            query {{
                reservationUnits(qualifiers: {qualifier.pk}) {{
                    edges {{
                        node {{
                            nameFi qualifiers {{
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

    def test_filtering_by_multiple_qualifiers(self):
        excluded = ReservationUnitFactory()  # should be excluded
        excluded.qualifiers.set([QualifierFactory()])

        qualifier = QualifierFactory(name="Filter test qualifier")
        other_qualifier = QualifierFactory(name="Other filter test qualifier")

        self.reservation_unit.qualifiers.set([qualifier])

        other_reservation_unit = ReservationUnitFactory(name="Other reservation unit")
        other_reservation_unit.qualifiers.set([other_qualifier])

        response = self.query(
            f"""
            query {{
                reservationUnits(qualifiers: [{qualifier.pk},{other_qualifier.pk}]) {{
                    edges {{
                        node {{
                            nameFi
                            qualifiers {{
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

    def test_filtering_by_max_persons_gte_within_limit(self):
        response = self.query(
            """
            query {
                reservationUnits(maxPersonsGte: 200) {
                    edges {
                        node {
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

    def test_filtering_by_max_persons_gte_outside_limit(self):
        response = self.query(
            """
            query {
                reservationUnits(maxPersonsGte: 201) {
                    edges {
                        node {
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

    def test_filtering_by_max_persons_gte_not_set(self):
        self.reservation_unit.max_persons = None
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits(maxPersonsGte: 201) {
                    edges {
                        node {
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

    def test_filtering_by_max_persons_lte_within_limit(self):
        response = self.query(
            """
            query {
                reservationUnits(maxPersonsLte: 200) {
                    edges {
                        node {
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

    def test_filtering_by_max_persons_lte_outside_limit(self):
        response = self.query(
            """
            query {
                reservationUnits(maxPersonsLte: 199) {
                    edges {
                        node {
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

    def test_filtering_by_max_persons_lte_not_set(self):
        self.reservation_unit.max_persons = None
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits(maxPersonsLte: 199) {
                    edges {
                        node {
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

    def test_filtering_by_min_persons_gte_within_limit(self):
        response = self.query(
            """
            query {
                reservationUnits(minPersonsGte: 10) {
                    edges {
                        node {
                            nameFi minPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_min_persons_gte_outside_limit(self):
        response = self.query(
            """
            query {
                reservationUnits(minPersonsGte: 11) {
                    edges {
                        node {
                            nameFi minPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_min_persons_gte_not_set(self):
        self.reservation_unit.min_persons = None
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits(minPersonsGte: 11) {
                    edges {
                        node {
                            nameFi minPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_min_persons_lte_within_limit(self):
        response = self.query(
            """
            query {
                reservationUnits(minPersonsLte: 10) {
                    edges {
                        node {
                            nameFi minPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_min_persons_lte_outside_limit(self):
        response = self.query(
            """
            query {
                reservationUnits(minPersonsLte: 9) {
                    edges {
                        node {
                            nameFi minPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_min_persons_lte_not_set(self):
        self.reservation_unit.min_persons = None
        self.reservation_unit.save()
        response = self.query(
            """
            query {
                reservationUnits(minPersonsLte: 9) {
                    edges {
                        node {
                            nameFi minPersons
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

    def test_filtering_by_name_fi(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(name_fi="show only me")
        response = self.query(
            """
            query {
                reservationUnits(nameFi: "show") {
                    edges {
                        node{
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

    def test_filtering_by_surface_area(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(surface_area=121)  # Do not include
        ReservationUnitFactory(surface_area=120)
        ReservationUnitFactory(surface_area=90)
        ReservationUnitFactory(surface_area=60)
        ReservationUnitFactory(surface_area=59)  # Do not include
        response = self.query(
            """
            query {
                reservationUnits(surfaceAreaLte:120, surfaceAreaGte:60) {
                    edges {
                        node{
                            surfaceArea
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_rank(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(rank=1)  # Do not include
        ReservationUnitFactory(rank=2)
        ReservationUnitFactory(rank=3)
        ReservationUnitFactory(rank=4)
        ReservationUnitFactory(rank=5)  # Do not include
        response = self.query(
            """
            query {
                reservationUnits(rankLte:4, rankGte:2) {
                    edges {
                        node{
                            rank
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_type_rank(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        rank1 = ReservationUnitTypeFactory(rank=1)  # Do not include
        rank2 = ReservationUnitTypeFactory(rank=2)
        rank3 = ReservationUnitTypeFactory(rank=3)
        rank4 = ReservationUnitTypeFactory(rank=4)
        rank5 = ReservationUnitTypeFactory(rank=5)  # Do not include
        ReservationUnitFactory(
            reservation_unit_type=rank1, name_fi="Rank 1"
        )  # Do not include
        ReservationUnitFactory(reservation_unit_type=rank2, name_fi="Rank 2")
        ReservationUnitFactory(reservation_unit_type=rank3, name_fi="Rank 3")
        ReservationUnitFactory(reservation_unit_type=rank4, name_fi="Rank 4")
        ReservationUnitFactory(
            reservation_unit_type=rank5, name_fi="Rank 5"
        )  # Do not include
        response = self.query(
            """
            query {
                reservationUnits(typeRankLte:4, typeRankGte:2) {
                    edges {
                        node{
                            nameFi
                            reservationUnitType {
                                rank
                            }
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_reservation_timestamps(self):
        now = datetime.datetime.now(get_default_timezone())
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
        self.maxDiff = None
        now = datetime.datetime.now(tz=get_default_timezone())
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
        now = datetime.datetime.now(tz=get_default_timezone())
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

    def test_filtering_by_is_visible_true(self):
        today = datetime.datetime.now(tz=get_default_timezone())
        # No publish times should be included in results.
        ReservationUnitFactory(name_fi="show me")

        # Publish begins before today should be included.
        ReservationUnitFactory(
            name_fi="show me too!",
            publish_begins=today - datetime.timedelta(days=5),
            publish_ends=today + datetime.timedelta(days=10),
        )

        # Publish begins after today should not be included.
        ReservationUnitFactory(
            name_fi="I'm invisible",
            publish_begins=today + datetime.timedelta(days=5),
            publish_ends=today + datetime.timedelta(days=10),
        )

        # Publish begin before and end time null should be included.
        ReservationUnitFactory(
            name_fi="Take me in!",
            publish_begins=today - datetime.timedelta(days=5),
            publish_ends=None,
        )

        # Publish end after today and begin time null should be included.
        ReservationUnitFactory(
            name_fi="Take me in too!",
            publish_ends=today + datetime.timedelta(days=5),
            publish_begins=None,
        )

        # Publish end after before today and begin time null shouldn't be included.
        ReservationUnitFactory(
            name_fi="I shouldn't be included!",
            publish_ends=today - datetime.timedelta(days=1),
            publish_begins=None,
        )

        # Archived units shouldn't be included
        ReservationUnitFactory(
            name_fi="I shouldn't be included because I'm archived!",
            publish_begins=today - datetime.timedelta(days=5),
            publish_ends=today + datetime.timedelta(days=10),
            is_archived=True,
        )

        response = self.query(
            """
            query {
                reservationUnits(isVisible: true) {
                    edges {
                        node {
                            nameFi
                            publishBegins
                            publishEnds
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_is_visible_false(self):
        # No publish time shouldn't include
        ReservationUnitFactory(name_fi="testing is besthing")

        response = self.query(
            """
            query {
                reservationUnits(isVisible: false) {
                    edges {
                        node {
                            nameFi
                            publishBegins
                            publishEnds
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
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(unit=UnitFactory(name_fi="2", name_sv="2", name_en="_"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="3", name_sv="_", name_en="2"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="2", name_sv="1", name_en="_"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="3", name_sv="_", name_en="1"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="1", name_sv="_", name_en="_"))
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "unitNameFi,unitNameSv,unitNameEn") {
                    edges {
                        node {
                            unit {
                                nameFi
                                nameSv
                                nameEn
                            }
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
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(unit=UnitFactory(name_fi="2", name_sv="2", name_en="_"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="3", name_sv="_", name_en="2"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="2", name_sv="1", name_en="_"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="3", name_sv="_", name_en="1"))
        ReservationUnitFactory(unit=UnitFactory(name_fi="1", name_sv="_", name_en="_"))
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "-unitNameFi,-unitNameSv,-unitNameEn") {
                    edges {
                        node {
                            unit {
                                nameFi
                                nameSv
                                nameEn
                            }
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_max_persons(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(max_persons=1)
        ReservationUnitFactory(max_persons=2)
        ReservationUnitFactory(max_persons=3)
        ReservationUnitFactory(max_persons=4)
        ReservationUnitFactory(max_persons=5)
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "maxPersons") {
                    edges {
                        node {
                            maxPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_max_persons_reverse_order(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(max_persons=1)
        ReservationUnitFactory(max_persons=2)
        ReservationUnitFactory(max_persons=3)
        ReservationUnitFactory(max_persons=4)
        ReservationUnitFactory(max_persons=5)
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "-maxPersons") {
                    edges {
                        node {
                            maxPersons
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_surface_area(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(surface_area=1)
        ReservationUnitFactory(surface_area=2)
        ReservationUnitFactory(surface_area=3)
        ReservationUnitFactory(surface_area=4)
        ReservationUnitFactory(surface_area=5)
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "maxPersons") {
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_surface_area_reverse_order(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(surface_area=1)
        ReservationUnitFactory(surface_area=2)
        ReservationUnitFactory(surface_area=3)
        ReservationUnitFactory(surface_area=4)
        ReservationUnitFactory(surface_area=5)
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "-maxPersons") {
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_name_and_unit_name(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(name="a", unit=UnitFactory(name_fi="2"))
        ReservationUnitFactory(name="a", unit=UnitFactory(name_fi="3"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="2"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="3"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="1"))
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "nameFi,unitNameFi") {
                    edges {
                        node {
                            nameFi
                            unit {
                                nameFi
                            }
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_name_and_unit_name_reversed(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(name="a", unit=UnitFactory(name_fi="2"))
        ReservationUnitFactory(name="a", unit=UnitFactory(name_fi="3"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="2"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="3"))
        ReservationUnitFactory(name="b", unit=UnitFactory(name_fi="1"))
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "-nameFi,-unitNameFi") {
                    edges {
                        node {
                            nameFi
                            unit {
                                nameFi
                            }
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_rank(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        ReservationUnitFactory(rank=5)
        ReservationUnitFactory(rank=3)
        ReservationUnitFactory(rank=1)
        ReservationUnitFactory(rank=2)
        ReservationUnitFactory(rank=4)

        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "rank") {
                    edges {
                        node {
                            rank
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_type_rank(self):
        ReservationUnit.objects.exclude(id=self.reservation_unit.id).delete()
        rank5 = ReservationUnitTypeFactory(rank=5)
        rank3 = ReservationUnitTypeFactory(rank=3)
        rank1 = ReservationUnitTypeFactory(rank=1)
        rank2 = ReservationUnitTypeFactory(rank=2)
        rank4 = ReservationUnitTypeFactory(rank=4)
        ReservationUnitFactory(name="Fifth", reservation_unit_type=rank5)
        ReservationUnitFactory(name="Third", reservation_unit_type=rank3)
        ReservationUnitFactory(name="First", reservation_unit_type=rank1)
        ReservationUnitFactory(name="Second", reservation_unit_type=rank2)
        ReservationUnitFactory(name="Fourth", reservation_unit_type=rank4)

        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservationUnits(orderBy: "typeRank") {
                    edges {
                        node {
                            reservationUnitType {
                                rank
                            }
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

    def test_filter_by_pk_single_value(self):
        response = self.query(
            f"""
            query {{
                reservationUnits(pk: {self.reservation_unit.id}) {{
                    edges {{
                        node {{
                            nameFi
                        }}
                    }}
                }}
            }}
            """
        )
        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_pk_multiple_values(self):
        second_reservation_unit = ReservationUnitFactory(name_fi="Second unit")
        response = self.query(
            f"""
            query {{
                reservationUnits(pk: [{self.reservation_unit.id}, {second_reservation_unit.id}]) {{
                    edges {{
                        node {{
                            nameFi
                        }}
                    }}
                }}
            }}
            """
        )
        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_that_filter_by_invalid_pk_returns_error(self):
        response = self.query(
            """
            query {
                reservationUnits(pk: 5) {
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

    def test_that_state_is_draft(self):
        self.reservation_unit.name = "This should be draft"
        self.reservation_unit.is_draft = True
        self.reservation_unit.save()
        response = self.query(
            f"""
            query {{
                reservationUnits(pk: {self.reservation_unit.id}) {{
                    edges {{
                        node {{
                            nameFi
                            state
                        }}
                    }}
                }}
            }}
            """
        )
        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_that_state_is_scheduled_publishing(self):
        now = datetime.datetime.now(tz=get_default_timezone())

        self.reservation_unit.name = "This should be scheduled publishing"
        self.reservation_unit.is_draft = False
        self.reservation_unit.is_archived = False
        self.reservation_unit.publish_begins = now + datetime.timedelta(hours=1)
        self.reservation_unit.save()
        response = self.query(
            f"""
            query {{
                reservationUnits(pk: {self.reservation_unit.id}) {{
                    edges {{
                        node {{
                            nameFi
                            state
                        }}
                    }}
                }}
            }}
            """
        )
        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_that_state_is_scheduled_reservation(self):
        now = datetime.datetime.now(tz=get_default_timezone())

        self.reservation_unit.name = "This should be scheduled reservation"
        self.reservation_unit.is_draft = False
        self.reservation_unit.is_archived = False
        self.reservation_unit.reservation_begins = now + datetime.timedelta(hours=1)
        self.reservation_unit.save()
        response = self.query(
            f"""
            query {{
                reservationUnits(pk: {self.reservation_unit.id}) {{
                    edges {{
                        node {{
                            nameFi
                            state
                        }}
                    }}
                }}
            }}
            """
        )
        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_that_state_is_published(self):
        self.reservation_unit.name = "This should be published"
        self.reservation_unit.is_draft = False
        self.reservation_unit.is_archived = False
        self.reservation_unit.publish_begins = None
        self.reservation_unit.publish_ends = None
        self.reservation_unit.reservation_begins = None
        self.reservation_unit.reservation_ends = None

        self.reservation_unit.save()
        response = self.query(
            f"""
            query {{
                reservationUnits(pk: {self.reservation_unit.id}) {{
                    edges {{
                        node {{
                            nameFi
                            state
                        }}
                    }}
                }}
            }}
            """
        )
        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_false()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_only_with_permission_unit_admin(self):
        unit = UnitFactory()
        unit_group_admin = get_user_model().objects.create(
            username="unit_admin",
            first_name="Amin",
            last_name="Dee",
            email="amin.dee@foo.com",
        )

        unit_role = UnitRole.objects.create(
            user=unit_group_admin,
            role=UnitRoleChoice.objects.get(code="admin"),
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_validate_applications",
        )

        unit_role.unit.add(unit)

        other_unit = UnitFactory()
        unit_role.unit_group.add(UnitGroupFactory(units=[other_unit]))

        ReservationUnitFactory(
            unit=other_unit, name_fi="I'm in result since i'm in the group"
        )
        ReservationUnitFactory(unit=unit, name_fi="I should be in the result")

        self.client.force_login(unit_group_admin)

        response = self.query(
            """
            query {
                reservationUnits(onlyWithPermission: true) {
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

    def test_filter_only_with_permission_service_sector_admin(self):
        service_sector = ServiceSectorFactory()
        service_sector_admin = get_user_model().objects.create(
            username="ss_admin",
            first_name="Amin",
            last_name="Dee",
            email="amin.dee@foo.com",
        )

        ServiceSectorRole.objects.create(
            user=service_sector_admin,
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            service_sector=service_sector,
        )
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_handle_applications",
        )

        unit = UnitFactory()
        service_sector.units.add(unit)

        ReservationUnitFactory(unit=unit, name_fi="I should be in the result")

        self.client.force_login(service_sector_admin)

        response = self.query(
            """
            query {
                reservationUnits(onlyWithPermission: true) {
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

    def test_filter_only_with_permission_general_admin_admin(self):
        ReservationUnitFactory(name_fi="I'm in the results with the other one too.")

        self.client.force_login(self.general_admin)

        response = self.query(
            """
            query {
                reservationUnits(onlyWithPermission: true) {
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

    def test_other_reservations_does_not_show_sensitive_information(self):
        self.client.force_login(self.regular_joe)

        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            user=self.general_admin,
            reservee_last_name="Admin",
            reservee_first_name="General",
            reservee_phone="123435",
            working_memo="I should not be visible",
            staff_event=False,
            reservee_email="no_visible@localhost",
            reservee_address_street="not visbile address",
            reservee_address_city="not visible city",
            reservee_address_zip="don't show this zip",
            reservee_organisation_name="don't show org name",
            free_of_charge_reason="do not display me",
            billing_first_name="not visible bill first",
            billing_last_name="not visible bill last",
            billing_address_street="not visible bill addr",
            billing_address_city="not visible city",
            billing_address_zip="not visible billing zip",
            billing_phone="not visible bill phone",
            billing_email="not visible bill email",
            description="not visible description",
            reservee_id="novisible",
            cancel_details="not visible cancel_details",
        )

        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            reservations {
                                user
                                reserveeLastName
                                reserveeFirstName
                                reserveePhone
                                workingMemo
                                staffEvent
                                reserveeEmail
                                reserveeAddressStreet
                                reserveeAddressCity
                                reserveeAddressZip
                                reserveeOrganisationName
                                freeOfChargeReason
                                billingFirstName
                                billingLastName
                                billingAddressStreet
                                billingAddressCity
                                billingAddressZip
                                billingPhone
                                billingEmail
                                description
                                reserveeId
                                cancelDetails
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

    def test_admin_sees_reservations_sensitive_information(self):
        self.client.force_login(self.general_admin)

        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            user=self.regular_joe,
            reservee_last_name="Reggie",
            reservee_first_name="Joe",
            reservee_phone="123435",
            working_memo="Working this memo",
            staff_event=False,
            reservee_email="email@localhost",
            reservee_address_street="address",
            reservee_address_city="city",
            reservee_address_zip="zip",
            reservee_organisation_name="org name",
            free_of_charge_reason="reason",
            billing_first_name="Joe",
            billing_last_name="Reggie",
            billing_address_street="addr",
            billing_address_city="city",
            billing_address_zip="zip",
            billing_phone="phone",
            billing_email="email",
            description="description",
            reservee_id="residee",
            cancel_details="cancdetails",
        )

        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            reservations {
                                user
                                reserveeLastName
                                reserveeFirstName
                                reserveePhone
                                workingMemo
                                staffEvent
                                reserveeEmail
                                reserveeAddressStreet
                                reserveeAddressCity
                                reserveeAddressZip
                                reserveeOrganisationName
                                freeOfChargeReason
                                billingFirstName
                                billingLastName
                                billingAddressStreet
                                billingAddressCity
                                billingAddressZip
                                billingPhone
                                billingEmail
                                description
                                reserveeId
                                cancelDetails
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
                            descriptionSv
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


class ReservationUnitsFilterStateTestCase(ReservationUnitQueryTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        now = datetime.datetime.now(tz=get_default_timezone())
        cls.archived_reservation_unit = ReservationUnitFactory(
            name="I am archived!", is_archived=True
        )
        cls.archived_reservation_unit = ReservationUnitFactory(
            name="I am a draft!", is_archived=False, is_draft=True
        )
        cls.scheduled_publishing_reservation_unit_1 = ReservationUnitFactory(
            name="I am scheduled for publishing!",
            is_archived=False,
            is_draft=False,
            publish_begins=(now + datetime.timedelta(hours=1)),
        )
        cls.scheduled_publishing_reservation_unit_2 = ReservationUnitFactory(
            name="I am also scheduled for publishing!",
            is_archived=False,
            is_draft=False,
            publish_ends=(now - datetime.timedelta(hours=1)),
        )
        cls.scheduled_reservation_reservation_unit_1 = ReservationUnitFactory(
            name="I am scheduled for reservation!",
            is_archived=False,
            is_draft=False,
            reservation_begins=(now + datetime.timedelta(hours=1)),
        )
        cls.scheduled_reservation_reservation_unit_2 = ReservationUnitFactory(
            name="I am also scheduled for reservation!",
            is_archived=False,
            is_draft=False,
            reservation_ends=(now - datetime.timedelta(hours=1)),
        )
        cls.published_reservation_unit = ReservationUnitFactory(
            name="Yey! I'm published!",
            is_archived=False,
            is_draft=False,
        )

    # Archived reservation units are always hidden
    def test_filtering_by_archived_returns_nothing(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"ARCHIVED"){
                    edges {
                        node {
                            nameFi
                            state
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(self.content_is_empty(content)).is_true()
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filtering_by_draft(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"DRAFT"){
                    edges {
                        node {
                            nameFi
                            state
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

    def test_filtering_by_scheduled_publishing(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"SCHEDULED_PUBLISHING"){
                    edges {
                        node {
                            nameFi
                            state
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

    def test_filtering_by_scheduled_reservation(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"SCHEDULED_RESERVATION"){
                    edges {
                        node {
                            nameFi
                            state
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

    def test_filtering_by_published(self):
        response = self.query(
            """
            query {
                reservationUnits(state:"PUBLISHED"){
                    edges {
                        node {
                            nameFi
                            state
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

    def test_filtering_by_mixed(self):
        response = self.query(
            """
            query {
                reservationUnits(state:["DRAFT", "SCHEDULED_PUBLISHING"]){
                    edges {
                        node {
                            nameFi
                            state
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
        cls.qualifier = QualifierFactory()
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
        cls.pricing_term = TermsOfUseFactory(
            name="Test pricing terms", terms_type=TermsOfUse.TERMS_TYPE_PRICING
        )

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

    def test_create_with_pricing_fields(self):
        self.client.force_login(self.general_admin)
        data = {
            "isDraft": True,
            "nameFi": "Unit with pricing fields",
            "unitPk": self.unit.id,
            "pricingType": "PAID",
            "pricingTermsPk": self.pricing_term.pk,
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("createReservationUnit").get("pk")
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_type).is_equal_to(PricingType.PAID)
        assert_that(created_unit.pricing_terms).is_equal_to(self.pricing_term)

    def test_create_with_payment_types(self):
        self.client.force_login(self.general_admin)
        data = {
            "isDraft": True,
            "nameFi": "Unit with pricing fields",
            "unitPk": self.unit.id,
            "pricingType": "PAID",
            "paymentTypes": ["ON_SITE", "INVOICE"],
        }
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("createReservationUnit").get("pk")
        )
        unit_payment_type_codes = list(
            map(lambda ptype: ptype.code, created_unit.payment_types.all())
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_type).is_equal_to(PricingType.PAID)

        assert_that(unit_payment_type_codes).contains_only(
            PaymentType.ON_SITE.value, PaymentType.INVOICE.value
        )

    def test_create_with_instructions(self):
        data = {
            "isDraft": True,
            "nameFi": "Resunit name",
            "nameEn": "English name",
            "descriptionFi": "desc",
            "reservationPendingInstructionsFi": "Pending instructions fi",
            "reservationPendingInstructionsSv": "Pending instructions sv",
            "reservationPendingInstructionsEn": "Pending instructions en",
            "reservationConfirmedInstructionsFi": "Confirmed instructions fi",
            "reservationConfirmedInstructionsSv": "Confirmed instructions sv",
            "reservationConfirmedInstructionsEn": "Confirmed instructions en",
            "reservationCancelledInstructionsFi": "Cancelled instructions fi",
            "reservationCancelledInstructionsSv": "Cancelled instructions sv",
            "reservationCancelledInstructionsEn": "Cancelled instructions en",
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
        assert_that(res_unit.reservation_pending_instructions_fi).is_equal_to(
            data["reservationPendingInstructionsFi"]
        )
        assert_that(res_unit.reservation_pending_instructions_sv).is_equal_to(
            data["reservationPendingInstructionsSv"]
        )
        assert_that(res_unit.reservation_pending_instructions_en).is_equal_to(
            data["reservationPendingInstructionsEn"]
        )
        assert_that(res_unit.reservation_confirmed_instructions_fi).is_equal_to(
            data["reservationConfirmedInstructionsFi"]
        )
        assert_that(res_unit.reservation_confirmed_instructions_sv).is_equal_to(
            data["reservationConfirmedInstructionsSv"]
        )
        assert_that(res_unit.reservation_confirmed_instructions_en).is_equal_to(
            data["reservationConfirmedInstructionsEn"]
        )
        assert_that(res_unit.reservation_cancelled_instructions_fi).is_equal_to(
            data["reservationCancelledInstructionsFi"]
        )
        assert_that(res_unit.reservation_cancelled_instructions_sv).is_equal_to(
            data["reservationCancelledInstructionsSv"]
        )
        assert_that(res_unit.reservation_cancelled_instructions_en).is_equal_to(
            data["reservationCancelledInstructionsEn"]
        )


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
            "contactInformation": "contact",
            "spacePks": [self.space.id],
            "resourcePks": [self.resource.id],
            "servicePks": [self.service.id],
            "unitPk": self.unit.id,
            "reservationUnitTypePk": self.reservation_unit_type.id,
            "surfaceArea": 100,
            "maxPersons": 10,
            "minPersons": 1,
            "bufferTimeAfter": 3600,
            "bufferTimeBefore": 3600,
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
            "requireReservationHandling": True,
            "authentication": "STRONG",
            "canApplyFreeOfCharge": True,
            "reservationsMaxDaysBefore": 360,
            "reservationsMinDaysBefore": 1,
            "reservationKind": ReservationKind.DIRECT,
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
        assert_that(res_unit.min_persons).is_equal_to(data.get("minPersons"))
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
        assert_that(res_unit.require_reservation_handling).is_equal_to(True)
        assert_that(res_unit.authentication).is_equal_to("strong")
        assert_that(res_unit.reservation_kind).is_equal_to(ReservationKind.DIRECT)
        assert_that(res_unit.can_apply_free_of_charge).is_equal_to(True)
        assert_that(res_unit.reservations_max_days_before).is_equal_to(360)
        assert_that(res_unit.reservations_min_days_before).is_equal_to(1)

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

    def test_create_with_multiple_qualifiers(self):
        qualifiers = QualifierFactory.create_batch(5)
        data = self.get_valid_data()
        data["qualifierPks"] = [qualifier.id for qualifier in qualifiers]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.id).is_equal_to(res_unit_data.get("pk"))
        assert_that(list(res_unit.qualifiers.all().values_list("id", flat=True))).is_in(
            data.get("qualifierPks")
        )

    def test_create_errors_on_wrong_type_of_qualifier_pk(self):
        data = self.get_valid_data()
        data["qualifierPks"] = ["q"]

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

    def test_min_persons_over_max_persons_errors(self):
        data = self.get_valid_data()
        data["minPersons"] = 11

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "minPersons can't be more than maxPersons"
        )
        assert_that(ReservationUnit.objects.exists()).is_false()

    def test_reservation_kind_defaults_to_direct_and_season(self):
        data = self.get_valid_data()
        data.pop("reservationKind")
        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("createReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        res_unit = ReservationUnit.objects.first()
        assert_that(res_unit).is_not_none()
        assert_that(res_unit.reservation_kind).is_equal_to(
            ReservationKind.DIRECT_AND_SEASON
        )

    def test_create_with_pricing_fields(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_data()
        data["pricingType"] = "PAID"
        data["pricingTermsPk"] = self.pricing_term.pk

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("createReservationUnit").get("pk")
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_type).is_equal_to(PricingType.PAID)
        assert_that(created_unit.pricing_terms).is_equal_to(self.pricing_term)

    def test_create_with_payment_types(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_data()
        data["pricingType"] = "PAID"
        data["paymentTypes"] = ["ONLINE", "INVOICE"]

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("createReservationUnit").get("pk")
        )
        unit_payment_type_codes = list(
            map(lambda ptype: ptype.code, created_unit.payment_types.all())
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_type).is_equal_to(PricingType.PAID)
        assert_that(unit_payment_type_codes).contains_only(
            PaymentType.ONLINE.value, PaymentType.INVOICE.value
        )

    def test_create_with_instructions(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_data()
        data["reservationPendingInstructionsFi"] = "Pending instructions fi"
        data["reservationPendingInstructionsSv"] = "Pending instructions sv"
        data["reservationPendingInstructionsEn"] = "Pending instructions en"
        data["reservationConfirmedInstructionsFi"] = "Confirmed instructions fi"
        data["reservationConfirmedInstructionsSv"] = "Confirmed instructions sv"
        data["reservationConfirmedInstructionsEn"] = "Confirmed instructions en"
        data["reservationCancelledInstructionsFi"] = "Cancelled instructions fi"
        data["reservationCancelledInstructionsSv"] = "Cancelled instructions sv"
        data["reservationCancelledInstructionsEn"] = "Cancelled instructions en"

        response = self.query(self.get_create_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("createReservationUnit").get("pk")
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.reservation_pending_instructions_fi).is_equal_to(
            data["reservationPendingInstructionsFi"]
        )
        assert_that(created_unit.reservation_pending_instructions_sv).is_equal_to(
            data["reservationPendingInstructionsSv"]
        )
        assert_that(created_unit.reservation_pending_instructions_en).is_equal_to(
            data["reservationPendingInstructionsEn"]
        )
        assert_that(created_unit.reservation_confirmed_instructions_fi).is_equal_to(
            data["reservationConfirmedInstructionsFi"]
        )
        assert_that(created_unit.reservation_confirmed_instructions_sv).is_equal_to(
            data["reservationConfirmedInstructionsSv"]
        )
        assert_that(created_unit.reservation_confirmed_instructions_en).is_equal_to(
            data["reservationConfirmedInstructionsEn"]
        )
        assert_that(created_unit.reservation_cancelled_instructions_fi).is_equal_to(
            data["reservationCancelledInstructionsFi"]
        )
        assert_that(created_unit.reservation_cancelled_instructions_sv).is_equal_to(
            data["reservationCancelledInstructionsSv"]
        )
        assert_that(created_unit.reservation_cancelled_instructions_en).is_equal_to(
            data["reservationCancelledInstructionsEn"]
        )


@override_settings(AUDIT_LOGGING_ENABLED=True)
class ReservationUnitUpdateDraftTestCase(ReservationUnitMutationsTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        AuditLogger.register(ReservationUnit)
        cls.res_unit = ReservationUnitFactory(
            is_draft=True,
            name="Resunit name",
            contact_information="Sonya Blade",
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

    def test_update_with_authentication(self):
        data = self.get_valid_update_data()
        data["authentication"] = "STRONG"
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.authentication).is_equal_to("strong")

    def test_update_errors_with_invalid_authentication(self):
        data = self.get_valid_update_data()
        data["authentication"] = "invalid"
        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            'Choice "invalid" is not allowed.'
        )
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.authentication).is_not_equal_to("invalid")

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

    def test_contact_information_removal_on_archive(self):
        data = self.get_valid_update_data()
        data["isArchived"] = True
        data["contactInformation"] = "Liu Kang"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.is_archived).is_equal_to(True)
        assert_that(self.res_unit.contact_information).is_equal_to("")

    def test_audit_log_deletion_on_archive(self):
        content_type_id = ContentType.objects.get(
            app_label="reservation_units", model="reservationunit"
        ).id
        log_entry_count = LogEntry.objects.filter(
            content_type_id=content_type_id, object_id=self.res_unit.pk
        ).count()

        assert_that(log_entry_count).is_greater_than(1)

        data = self.get_valid_update_data()
        data["isArchived"] = True
        data["contactInformation"] = "Liu Kang"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(res_unit_data.get("errors")).is_none()

        log_entry_count = LogEntry.objects.filter(
            content_type_id=content_type_id, object_id=self.res_unit.pk
        ).count()
        assert_that(log_entry_count).is_equal_to(1)

    def test_update_with_pricing_fields(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["pricingType"] = "PAID"
        data["pricingTermsPk"] = self.pricing_term.pk

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("updateReservationUnit").get("pk")
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_type).is_equal_to(PricingType.PAID)
        assert_that(created_unit.pricing_terms).is_equal_to(self.pricing_term)

    def test_update_with_payment_types(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["pricingType"] = "PAID"
        data["paymentTypes"] = ["INVOICE", "ONLINE"]

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservationUnit").get("pk")
        ).is_not_none()

        updated_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("updateReservationUnit").get("pk")
        )

        unit_payment_type_codes = list(
            map(lambda ptype: ptype.code, updated_unit.payment_types.all())
        )
        assert_that(updated_unit).is_not_none()
        assert_that(updated_unit.pricing_type).is_equal_to(PricingType.PAID)
        assert_that(unit_payment_type_codes).contains_only(
            PaymentType.ONLINE.value, PaymentType.INVOICE.value
        )

    def test_update_with_instructions(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["reservationPendingInstructionsFi"] = "Pending instructions updated fi"
        data["reservationPendingInstructionsSv"] = "Pending instructions updated sv"
        data["reservationPendingInstructionsEn"] = "Pending instructions updated en"
        data["reservationConfirmedInstructionsFi"] = "Confirmed instructions updated fi"
        data["reservationConfirmedInstructionsSv"] = "Confirmed instructions updated sv"
        data["reservationConfirmedInstructionsEn"] = "Confirmed instructions updated en"
        data["reservationCancelledInstructionsFi"] = "Cancelled instructions updated fi"
        data["reservationCancelledInstructionsSv"] = "Cancelled instructions updated sv"
        data["reservationCancelledInstructionsEn"] = "Cancelled instructions updated en"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservationUnit").get("pk")
        ).is_not_none()

        updated_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("updateReservationUnit").get("pk")
        )
        assert_that(updated_unit).is_not_none()
        assert_that(updated_unit.reservation_pending_instructions_fi).is_equal_to(
            data["reservationPendingInstructionsFi"]
        )
        assert_that(updated_unit.reservation_pending_instructions_sv).is_equal_to(
            data["reservationPendingInstructionsSv"]
        )
        assert_that(updated_unit.reservation_pending_instructions_en).is_equal_to(
            data["reservationPendingInstructionsEn"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_fi).is_equal_to(
            data["reservationConfirmedInstructionsFi"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_sv).is_equal_to(
            data["reservationConfirmedInstructionsSv"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_en).is_equal_to(
            data["reservationConfirmedInstructionsEn"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_fi).is_equal_to(
            data["reservationCancelledInstructionsFi"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_sv).is_equal_to(
            data["reservationCancelledInstructionsSv"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_en).is_equal_to(
            data["reservationCancelledInstructionsEn"]
        )


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
            contact_information="Info",
            reservation_unit_type=cls.reservation_unit_type,
            unit=cls.unit,
            max_persons=10,
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

    def test_update_reservation_confirmed_instructions(self):
        expected_fi = "Lisätietoja"
        expected_sv = "Ytterligare instruktioner"
        expected_en = "Additional instructions"
        data = self.get_valid_update_data()
        data["reservationConfirmedInstructionsFi"] = expected_fi
        data["reservationConfirmedInstructionsSv"] = expected_sv
        data["reservationConfirmedInstructionsEn"] = expected_en
        update_query = """
            mutation updateReservationUnit($input: ReservationUnitUpdateMutationInput!) {
                updateReservationUnit(input: $input) {
                    reservationConfirmedInstructionsFi
                    reservationConfirmedInstructionsSv
                    reservationConfirmedInstructionsEn
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
        assert_that(
            res_unit_data.get("reservationConfirmedInstructionsFi")
        ).is_equal_to(expected_fi)
        assert_that(
            res_unit_data.get("reservationConfirmedInstructionsSv")
        ).is_equal_to(expected_sv)
        assert_that(
            res_unit_data.get("reservationConfirmedInstructionsEn")
        ).is_equal_to(expected_en)
        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.reservation_confirmed_instructions_fi).is_equal_to(
            expected_fi
        )
        assert_that(self.res_unit.reservation_confirmed_instructions_sv).is_equal_to(
            expected_sv
        )
        assert_that(self.res_unit.reservation_confirmed_instructions_en).is_equal_to(
            expected_en
        )

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

    def test_min_persons_over_max_persons_errors(self):
        data = self.get_valid_update_data()
        data["minPersons"] = 11

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_not_none()
        assert_that(res_unit_data.get("errors")[0].get("messages")[0]).contains(
            "minPersons can't be more than maxPersons"
        )

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.min_persons).is_none()

    def test_min_persons_updates(self):
        data = self.get_valid_update_data()
        data["minPersons"] = 1

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        res_unit_data = content.get("data").get("updateReservationUnit")
        assert_that(content.get("errors")).is_none()
        assert_that(res_unit_data.get("errors")).is_none()

        self.res_unit.refresh_from_db()
        assert_that(self.res_unit.min_persons).is_equal_to(1)

    def test_update_with_pricing_fields(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["pricingType"] = "PAID"
        data["pricingTermsPk"] = self.pricing_term.pk

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservationUnit").get("pk")
        ).is_not_none()

        created_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("updateReservationUnit").get("pk")
        )
        assert_that(created_unit).is_not_none()
        assert_that(created_unit.pricing_type).is_equal_to(PricingType.PAID)
        assert_that(created_unit.pricing_terms).is_equal_to(self.pricing_term)

    def test_update_with_payment_types(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["pricingType"] = "PAID"
        data["paymentTypes"] = ["ON_SITE", "INVOICE"]

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservationUnit").get("pk")
        ).is_not_none()

        updated_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("updateReservationUnit").get("pk")
        )
        unit_payment_type_codes = list(
            map(lambda ptype: ptype.code, updated_unit.payment_types.all())
        )
        assert_that(updated_unit).is_not_none()
        assert_that(updated_unit.pricing_type).is_equal_to(PricingType.PAID)
        assert_that(unit_payment_type_codes).contains_only(
            PaymentType.ON_SITE.value, PaymentType.INVOICE.value
        )

    def test_update_with_instructions(self):
        self.client.force_login(self.general_admin)
        data = self.get_valid_update_data()
        data["reservationPendingInstructionsFi"] = "Pending instructions updated fi"
        data["reservationPendingInstructionsSv"] = "Pending instructions updated sv"
        data["reservationPendingInstructionsEn"] = "Pending instructions updated en"
        data["reservationConfirmedInstructionsFi"] = "Confirmed instructions updated fi"
        data["reservationConfirmedInstructionsSv"] = "Confirmed instructions updated sv"
        data["reservationConfirmedInstructionsEn"] = "Confirmed instructions updated en"
        data["reservationCancelledInstructionsFi"] = "Cancelled instructions updated fi"
        data["reservationCancelledInstructionsSv"] = "Cancelled instructions updated sv"
        data["reservationCancelledInstructionsEn"] = "Cancelled instructions updated en"

        response = self.query(self.get_update_query(), input_data=data)
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservationUnit").get("pk")
        ).is_not_none()

        updated_unit = ReservationUnit.objects.get(
            pk=content.get("data").get("updateReservationUnit").get("pk")
        )
        assert_that(updated_unit).is_not_none()
        assert_that(updated_unit.reservation_pending_instructions_fi).is_equal_to(
            data["reservationPendingInstructionsFi"]
        )
        assert_that(updated_unit.reservation_pending_instructions_sv).is_equal_to(
            data["reservationPendingInstructionsSv"]
        )
        assert_that(updated_unit.reservation_pending_instructions_en).is_equal_to(
            data["reservationPendingInstructionsEn"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_fi).is_equal_to(
            data["reservationConfirmedInstructionsFi"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_sv).is_equal_to(
            data["reservationConfirmedInstructionsSv"]
        )
        assert_that(updated_unit.reservation_confirmed_instructions_en).is_equal_to(
            data["reservationConfirmedInstructionsEn"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_fi).is_equal_to(
            data["reservationCancelledInstructionsFi"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_sv).is_equal_to(
            data["reservationCancelledInstructionsSv"]
        )
        assert_that(updated_unit.reservation_cancelled_instructions_en).is_equal_to(
            data["reservationCancelledInstructionsEn"]
        )
