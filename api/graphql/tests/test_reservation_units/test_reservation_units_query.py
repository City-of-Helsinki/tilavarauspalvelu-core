import datetime
import json
from unittest import mock
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from api.graphql.tests.test_reservation_units.base import (
    ReservationUnitQueryTestCaseBase,
    get_mocked_opening_hours,
    get_mocked_periods,
    mock_create_product,
)
from applications.tests.factories import ApplicationRoundFactory
from merchants.tests.factories import PaymentMerchantFactory
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
from reservation_units.models import ReservationKind, ReservationUnit
from reservation_units.tests.factories import (
    KeywordCategoryFactory,
    KeywordGroupFactory,
    PurposeFactory,
    QualifierFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    ReservationUnitTypeFactory,
)
from reservations.models import STATE_CHOICES
from reservations.tests.factories import ReservationFactory
from spaces.tests.factories import ServiceSectorFactory, UnitFactory, UnitGroupFactory
from terms_of_use.models import TermsOfUse
from terms_of_use.tests.factories import TermsOfUseFactory
from users.models import PersonalInfoViewLog

DEFAULT_TIMEZONE = get_default_timezone()


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
                            pricings {
                                begins
                                pricingType
                                priceUnit
                                lowestPrice
                                highestPrice
                                taxPercentage {
                                    value
                                }
                                status
                            }
                            paymentMerchant {
                                name
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

    def test_filtering_by_reservation_kind_direct(self):
        ReservationUnitFactory(
            reservation_kind=ReservationKind.DIRECT, name_fi="show me"
        )
        ReservationUnitFactory(
            reservation_kind=ReservationKind.DIRECT_AND_SEASON,
            name_fi="show me as well",
        )
        ReservationUnitFactory(
            reservation_kind=ReservationKind.SEASON, name_fi="Don't you ever show me"
        )

        response = self.query(
            """
            query {
                reservationUnits(reservationKind: "DIRECT") {
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

    def test_filtering_by_reservation_kind_season(self):
        ReservationUnitFactory(
            reservation_kind=ReservationKind.SEASON, name_fi="show me"
        )
        ReservationUnitFactory(
            reservation_kind=ReservationKind.DIRECT_AND_SEASON,
            name_fi="show me as well",
        )
        ReservationUnitFactory(
            reservation_kind=ReservationKind.DIRECT, name_fi="Don't you ever show me"
        )

        response = self.query(
            """
            query {
                reservationUnits(reservationKind: "SEASON") {
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
        self.general_admin.date_of_birth = datetime.date(2020, 1, 1)
        self.general_admin.save()
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
                                user { email dateOfBirth }
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

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_admin_sees_reservations_sensitive_information(self):
        self.client.force_login(self.general_admin)
        self.regular_joe.date_of_birth = datetime.date(2020, 1, 1)
        self.regular_joe.save()
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
                                user { dateOfBirth }
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
        assert_that(PersonalInfoViewLog.objects.all().count()).is_equal_to(1)

    @mock.patch(
        "reservation_units.tasks.create_product", return_value=mock_create_product()
    )
    def test_show_payment_merchant_from_reservation_unit(self, mock_product):
        merchant = PaymentMerchantFactory.create(name="Test Merchant")
        self.client.force_login(self.general_admin)

        self.reservation_unit.payment_merchant = merchant
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            paymentMerchant {
                                name
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

    @mock.patch(
        "reservation_units.tasks.create_product", return_value=mock_create_product()
    )
    def test_show_payment_merchant_from_unit(self, mock_create_product):
        self.client.force_login(self.general_admin)

        merchant = PaymentMerchantFactory.create(name="Test Merchant")
        self.unit.payment_merchant = merchant
        self.unit.save()

        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            paymentMerchant {
                                name
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

    @mock.patch(
        "reservation_units.tasks.create_product", return_value=mock_create_product()
    )
    def test_hide_payment_merchant_without_permissions(self, mock_product):
        merchant = PaymentMerchantFactory.create(name="Test Merchant")

        self.reservation_unit.payment_merchant = merchant
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            paymentMerchant {
                                name
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

    def test_by_pk_has_reservations(self):
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
                reservationUnitByPk(pk: %i) {
                    nameFi
                    reservations(from: "2021-05-03", to: "2021-05-04") {
                        begin
                        end
                        state
                    }
                }
            }
            """
            % self.reservation_unit.id
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    @mock.patch(
        "reservation_units.tasks.create_product", return_value=mock_create_product()
    )
    def test_show_payment_product(self, mock_product):
        self.client.force_login(self.general_admin)

        merchant_pk = UUID("3828ac38-3e26-4501-8556-ba2ea3442627")
        merchant = PaymentMerchantFactory.create(id=merchant_pk, name="Test Merchant")
        ReservationUnitPricingFactory(reservation_unit=self.reservation_unit)

        self.reservation_unit.payment_merchant = merchant
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            paymentProduct {
                                pk
                                merchantPk
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

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    @mock.patch(
        "reservation_units.tasks.create_product", return_value=mock_create_product()
    )
    def test_hide_payment_product_without_permissions(self, mock_product):
        merchant_pk = UUID("3828ac38-3e26-4501-8556-ba2ea3442627")
        merchant = PaymentMerchantFactory.create(pk=merchant_pk, name="Test Merchant")

        self.reservation_unit.payment_merchant = merchant
        self.reservation_unit.save()

        response = self.query(
            """
            query {
                reservationUnits {
                    edges {
                        node {
                            nameFi
                            paymentProduct {
                                pk
                                merchantPk
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
