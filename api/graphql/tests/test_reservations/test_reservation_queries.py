import datetime
import json

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from applications.models import CUSTOMER_TYPES, City
from reservation_units.tests.factories import (
    ReservationUnitFactory,
    ReservationUnitTypeFactory,
)
from reservations.models import STATE_CHOICES, AgeGroup
from reservations.tests.factories import (
    ReservationFactory,
    ReservationMetadataSetFactory,
)
from spaces.tests.factories import UnitFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationQueryTestCase(ReservationTestCaseBase):
    def create_reservation_by_admin(self):
        reservation_begin = datetime.datetime.now(tz=get_default_timezone())
        reservation_end = datetime.datetime.now(
            tz=get_default_timezone()
        ) + datetime.timedelta(hours=1)
        ReservationFactory(
            reservee_first_name="Shouldbe",
            reservee_last_name="Hidden",
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_organisation_name="Hidden organisation",
            reservee_address_street="Mystery street 2",
            reservee_address_city="Nowhere",
            reservee_address_zip="00100",
            reservee_phone="+358123456789",
            reservee_email="shouldbe.hidden@example.com",
            reservee_id="5727586-5",
            reservee_is_unregistered_association=False,
            home_city=City.objects.create(name="Test"),
            applying_for_free_of_charge=True,
            free_of_charge_reason="Only admins can see me.",
            age_group=AgeGroup.objects.create(minimum=18, maximum=30),
            billing_first_name="Shouldbe",
            billing_last_name="Hidden",
            billing_address_street="Privacy 12B",
            billing_address_city="Hidden",
            billing_address_zip="20100",
            billing_phone="+358234567890",
            billing_email="hidden.billing@example.com",
            name="admin movies",
            description="something super secret",
            reservation_unit=[self.reservation_unit],
            begin=reservation_begin,
            end=reservation_end,
            state=STATE_CHOICES.CREATED,
            user=self.general_admin,
            priority=100,
            purpose=self.purpose,
            unit_price=10,
            tax_percentage_value=24,
            price=10,
            working_memo="i'm visible to admins",
            buffer_time_before=datetime.timedelta(minutes=15),
            buffer_time_after=datetime.timedelta(minutes=30),
            staff_event=False,
        )

    def get_query_with_personal_fields(self, query_type: str):
        return (
            "query { %s {" % query_type
            + """
                    totalCount
                    edges {
                        node {
                            name
                            user
                            reserveeFirstName
                            reserveeLastName
                            reserveePhone
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
                            begin
                            end
                        }
                    }
                }
            }
            """
        )

    def setUp(self):
        super().setUp()
        reservation_begin = datetime.datetime.now(tz=get_default_timezone())
        reservation_end = datetime.datetime.now(
            tz=get_default_timezone()
        ) + datetime.timedelta(hours=1)
        self.reservation = ReservationFactory(
            reservee_first_name="Reser",
            reservee_last_name="Vee",
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_organisation_name="Test organisation",
            reservee_address_street="Mannerheimintie 2",
            reservee_address_city="Helsinki",
            reservee_address_zip="00100",
            reservee_phone="+358123456789",
            reservee_email="reservee@example.com",
            reservee_id="5727586-5",
            reservee_is_unregistered_association=False,
            home_city=City.objects.create(name="Test"),
            applying_for_free_of_charge=True,
            free_of_charge_reason="This is some reason.",
            age_group=AgeGroup.objects.create(minimum=18, maximum=30),
            billing_first_name="Reser",
            billing_last_name="Vee",
            billing_address_street="Aurakatu 12B",
            billing_address_city="Turku",
            billing_address_zip="20100",
            billing_phone="+358234567890",
            billing_email="billing@example.com",
            name="movies",
            description="movies&popcorn",
            reservation_unit=[self.reservation_unit],
            begin=reservation_begin,
            end=reservation_end,
            state=STATE_CHOICES.CREATED,
            user=self.regular_joe,
            priority=100,
            purpose=self.purpose,
            unit_price=10,
            tax_percentage_value=24,
            price=10,
            working_memo="i'm visible to staff users",
            buffer_time_before=datetime.timedelta(minutes=15),
            buffer_time_after=datetime.timedelta(minutes=30),
        )

    def test_reservation_query(self):
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservations {
                    edges {
                        node {
                            state
                            priority
                            user
                            begin
                            end
                            bufferTimeBefore
                            bufferTimeAfter
                            reservationUnits{nameFi}
                            recurringReservation{user}
                            numPersons
                            reserveeFirstName
                            reserveeLastName
                            reserveeType
                            reserveeOrganisationName
                            reserveeAddressStreet
                            reserveeAddressCity
                            reserveeAddressZip
                            reserveePhone
                            reserveeEmail
                            reserveeId
                            reserveeIsUnregisteredAssociation
                            homeCity {
                                name
                            }
                            applyingForFreeOfCharge
                            freeOfChargeReason
                            ageGroup {
                                minimum
                                maximum
                            }
                            billingFirstName
                            billingLastName
                            billingAddressStreet
                            billingAddressCity
                            billingAddressZip
                            billingPhone
                            billingEmail
                            name
                            description
                            purpose {nameFi}
                            unitPrice
                            taxPercentageValue
                            price
                            bufferTimeBefore
                            bufferTimeAfter
                            staffEvent
                            type
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_reservation_state_requires_handling(self):
        self.maxDiff = None
        self.client.force_login(self.general_admin)
        metadata = ReservationMetadataSetFactory()
        res_unit = ReservationUnitFactory(metadata_set=metadata)
        ReservationFactory(
            state=STATE_CHOICES.REQUIRES_HANDLING,
            reservation_unit=[res_unit],
            recurring_reservation=None,
            name="Show me",
        )
        response = self.query(
            """
            query {
                reservations(state: "REQUIRES_HANDLING") {
                    edges {
                        node {
                            state
                            name
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_reservation_state_accepts_multiple_values(self):
        self.maxDiff = None
        self.client.force_login(self.general_admin)
        metadata = ReservationMetadataSetFactory()
        res_unit = ReservationUnitFactory(metadata_set=metadata)
        ReservationFactory(
            state=STATE_CHOICES.REQUIRES_HANDLING,
            reservation_unit=[res_unit],
            recurring_reservation=None,
            name="Show me",
            begin=datetime.datetime.now() + datetime.timedelta(days=2),
        )
        ReservationFactory(
            state=STATE_CHOICES.CANCELLED,
            reservation_unit=[res_unit],
            recurring_reservation=None,
            name="Show me too",
            begin=datetime.datetime.now() + datetime.timedelta(days=1),
        )
        response = self.query(
            """
            query {
                reservations(state: ["REQUIRES_HANDLING", "CANCELLED"]) {
                    edges {
                        node {
                            state
                            name
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_requested(self):
        self.maxDiff = None
        self.client.force_login(self.general_admin)
        metadata = ReservationMetadataSetFactory()
        res_unit = ReservationUnitFactory(metadata_set=metadata)
        ReservationFactory(
            state=STATE_CHOICES.REQUIRES_HANDLING,
            reservation_unit=[res_unit],
            recurring_reservation=None,
            name="This is requested",
        )
        ReservationFactory(
            state=STATE_CHOICES.CONFIRMED,
            reservation_unit=[res_unit],
            recurring_reservation=None,
            name="I'm requesting this to be dealt with. Oh this is already dealt with, nice!",
            handled_at=datetime.datetime.now(tz=get_default_timezone()),
        )
        response = self.query(
            """
            query {
                reservations(requested: true orderBy: "state") {
                    edges {
                        node {
                            state
                            name
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_admin_can_read_working_memo(self):
        self.maxDiff = None
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations {
                    edges {
                        node {
                            workingMemo
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_regular_user_cant_read_working_memo(self):
        self.maxDiff = None
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservations {
                    edges {
                        node {
                            workingMemo
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_reservation_total_count(self):
        self.maxDiff = None
        self.client.force_login(self.regular_joe)
        response = self.query(
            """
            query {
                reservations {
                    totalCount
                    edges {
                        node {
                            state
                        }
                    }
                }
            }
            """
        )

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_hide_fields_with_personal_information(self):
        self.create_reservation_by_admin()
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_query_with_personal_fields("""reservations(orderBy:"name")""")
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_only_with_permission(self):
        self.create_reservation_by_admin()
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_query_with_personal_fields(
                """reservations(onlyWithPermission:true, orderBy:"name")"""
            )
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_only_with_permission_admin(self):
        self.maxDiff = None
        self.create_reservation_by_admin()
        self.client.force_login(self.general_admin)
        response = self.query(
            self.get_query_with_personal_fields(
                """reservations(onlyWithPermission:true, orderBy:"name")"""
            )
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_user(self):
        self.create_reservation_by_admin()
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(user:%s) {
                    totalCount
                    edges {
                        node {
                            user
                        }
                    }
                }
            }
            """
            % self.regular_joe.pk
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit_name(self):
        self.reservation_unit.name_fi = "Koirankoppi"
        self.reservation_unit.name_en = "Doghouse"
        self.reservation_unit.name_sv = "Hundkoja"
        self.reservation_unit.save()

        self.client.force_login(self.general_admin)

        test_cases = [
            ("reservationUnitNameFi", "Koi", "nameFi"),
            ("reservationUnitNameEn", "Dog", "nameEn"),
            ("reservationUnitNameSv", "Hun", "nameSv"),
        ]
        for filter_name, filter_value, field_name in test_cases:
            response = self.query(
                """
                query {
                    reservations(%s: "%s") {
                        totalCount
                        edges {
                            node {
                                name
                                reservationUnits {
                                    %s
                                }
                            }
                        }
                    }
                }
                """
                % (filter_name, filter_value, field_name)
            )
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit_name_multiple_values(self):
        self.reservation_unit.name_fi = "Koirankoppi"
        self.reservation_unit.name_en = "Doghouse"
        self.reservation_unit.name_sv = "Hundkoja"
        self.reservation_unit.save()

        reservation_unit = ReservationUnitFactory(
            name_fi="Norsutarha", name_en="Elephant park", name_sv="Elefantparken"
        )
        ReservationFactory(
            name="second test",
            user=self.general_admin,
            reservation_unit=[reservation_unit],
        )

        self.client.force_login(self.general_admin)

        test_cases = [
            ("reservationUnitNameFi", "Koi, Nors", "nameFi"),
            ("reservationUnitNameEn", "Dog, Elep", "nameEn"),
            ("reservationUnitNameSv", "Hun, Elef", "nameSv"),
        ]
        for filter_name, filter_value, field_name in test_cases:
            response = self.query(
                """
                query {
                    reservations(%s: "%s", orderBy:"name") {
                        totalCount
                        edges {
                            node {
                                name
                                reservationUnits {
                                    %s
                                }
                            }
                        }
                    }
                }
                """
                % (filter_name, filter_value, field_name)
            )
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            self.assertMatchSnapshot(content)

    def test_filter_by_unit(self):
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(unit:%s, orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnits {
                                nameFi
                                unit {
                                    nameFi
                                }
                            }
                        }
                    }
                }
            }
            """
            % self.unit.pk
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_unit_multiple_values(self):
        unit = UnitFactory(name="Another unit")
        reservation_unit = ReservationUnitFactory(name="Another resunit", unit=unit)
        ReservationFactory(
            name="Another reservation", reservation_unit=[reservation_unit]
        )

        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(unit:[%s, %s], orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnits {
                                nameFi
                                unit {
                                    nameFi
                                }
                            }
                        }
                    }
                }
            }
            """
            % (self.unit.pk, unit.pk)
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_price_lte(self):
        ReservationFactory(
            name="Another reservation",
            reservation_unit=[self.reservation_unit],
            price=50,
        )

        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(priceLte:10, orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            price
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_price_gte(self):
        ReservationFactory(
            name="Another reservation",
            reservation_unit=[self.reservation_unit],
            price=50,
        )

        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(priceGte:11, orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            price
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit_type(self):
        reservation_unit_type = ReservationUnitTypeFactory(name="Another type")
        reservation_unit = ReservationUnitFactory(
            name="Another resunit", reservation_unit_type=reservation_unit_type
        )
        ReservationFactory(
            name="Another reservation",
            reservation_unit=[reservation_unit],
            price=50,
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(reservationUnitType: %s, orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnits {
                                reservationUnitType {
                                    nameFi
                                }
                            }
                        }
                    }
                }
            }
            """
            % self.reservation_unit_type.pk
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_reservation_unit_type_multiple_values(self):
        reservation_unit_type = ReservationUnitTypeFactory(name="Another type")
        reservation_unit = ReservationUnitFactory(
            name="Another resunit", reservation_unit_type=reservation_unit_type
        )
        ReservationFactory(
            name="Another reservation",
            reservation_unit=[reservation_unit],
            price=50,
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(reservationUnitType: [%s, %s], orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reservationUnits {
                                reservationUnitType {
                                    nameFi
                                }
                            }
                        }
                    }
                }
            }
            """
            % (self.reservation_unit_type.pk, reservation_unit_type.pk)
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_text_search_numeric(self):
        self.maxDiff = None
        reservation = ReservationFactory(
            name="ID will find me",
            reservation_unit=[self.reservation_unit],
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(textSearch: "%s", orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                        }
                    }
                }
            }
            """
            % (reservation.pk)
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_text_search_name(self):
        ReservationFactory(
            name="Name will find me",
            reservation_unit=[self.reservation_unit],
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(textSearch: "will find", orderBy:"name") {
                    totalCount
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
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_text_search_business_reservee_name(self):
        ReservationFactory(
            name="Test reservation",
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS,
            reservee_organisation_name="Bizniz name will find me",
            reservation_unit=[self.reservation_unit],
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(textSearch: "niz name", orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reserveeOrganisationName
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_text_search_non_profit_reservee_name(self):
        ReservationFactory(
            name="Test reservation",
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_NONPROFIT,
            reservee_organisation_name="Non-profit name will find me",
            reservation_unit=[self.reservation_unit],
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(textSearch: "profit name", orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reserveeOrganisationName
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_filter_by_text_search_individual_reservee_name(self):
        ReservationFactory(
            name="Test reservation",
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_first_name="First",
            reservee_last_name="Name",
            reservation_unit=[self.reservation_unit],
        )
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(textSearch: "st na", orderBy:"name") {
                    totalCount
                    edges {
                        node {
                            name
                            reserveeFirstName
                            reserveeLastName
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_reservation_unit_name(self):
        resunitA = ReservationUnitFactory(
            name_fi="a Unit", name_en="d Unit", name_sv="g unit"
        )
        resunitB = ReservationUnitFactory(
            name_fi="b Unit", name_en="e Unit", name_sv="h unit"
        )
        resunitC = ReservationUnitFactory(
            name_fi="c Unit", name_en="f Unit", name_sv="i unit"
        )

        ReservationFactory(name="this should be 1st", reservation_unit=[resunitA])
        ReservationFactory(name="this should be 2nd", reservation_unit=[resunitB])
        ReservationFactory(name="this should be 3rd", reservation_unit=[resunitC])

        self.client.force_login(self.general_admin)
        test_data = ["Fi", "En", "Sv"]
        for lang in test_data:
            response = self.query(
                """
                query {
                    reservations(orderBy:"reservationUnitName%s") {
                        totalCount
                        edges {
                            node {
                                name
                                reservationUnits {
                                    name%s
                                }
                            }
                        }
                    }
                }
                """
                % (lang, lang)
            )
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            self.assertMatchSnapshot(content)

    def test_order_by_reservee_name(self):
        self.maxDiff = None
        ReservationFactory(
            name="this should be 1st",
            reservation_unit=[self.reservation_unit],
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_BUSINESS,
            reservee_organisation_name="A company",
            reservee_first_name="",
            reservee_last_name="",
        )
        ReservationFactory(
            name="this should be 2nd",
            reservation_unit=[self.reservation_unit],
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_NONPROFIT,
            reservee_organisation_name="B non-profit",
            reservee_first_name="",
            reservee_last_name="",
        )
        ReservationFactory(
            name="this should be 3rd",
            reservation_unit=[self.reservation_unit],
            reservee_type=CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL,
            reservee_first_name="Charlie",
            reservee_last_name="Chaplin",
            reservee_organisation_name="",
        )

        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations(orderBy:"reserveeName") {
                    totalCount
                    edges {
                        node {
                            name
                            reserveeOrganisationName
                            reserveeFirstName
                            reserveeLastName
                            reserveeType
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_order_by_unit_name(self):
        unitA = UnitFactory(name_fi="a Unit", name_en="d Unit", name_sv="g unit")
        unitB = UnitFactory(name_fi="b Unit", name_en="e Unit", name_sv="h unit")
        unitC = UnitFactory(name_fi="c Unit", name_en="f Unit", name_sv="i unit")

        resunitA = ReservationUnitFactory(name="1st resunit", unit=unitA)
        resunitB = ReservationUnitFactory(name="2nd resunit", unit=unitB)
        resunitC = ReservationUnitFactory(name="3nd resunit", unit=unitC)

        ReservationFactory(name="this should be 1st", reservation_unit=[resunitA])
        ReservationFactory(name="this should be 2nd", reservation_unit=[resunitB])
        ReservationFactory(name="this should be 3rd", reservation_unit=[resunitC])

        self.client.force_login(self.general_admin)
        test_data = ["Fi", "En", "Sv"]
        for lang in test_data:
            response = self.query(
                """
                query {
                    reservations(orderBy:"unitName%s") {
                        totalCount
                        edges {
                            node {
                                name
                                reservationUnits {
                                    unit {
                                        name%s
                                    }
                                }
                            }
                        }
                    }
                }
                """
                % (lang, lang)
            )
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            self.assertMatchSnapshot(content)

    def test_getting_reservation_with_fields_requiring_special_permissions(self):
        self.client.force_login(self.general_admin)
        response = self.query(
            """
            query {
                reservations {
                    totalCount
                    edges {
                        node {
                            name
                            staffEvent
                            type
                        }
                    }
                }
            }
            """
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationByPkTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation = ReservationFactory(
            reservation_unit=[cls.reservation_unit],
            reservee_first_name="Joe",
            reservee_last_name="Regular",
            reservee_phone="+358123456789",
            name="Test reservation",
            user=cls.regular_joe,
        )

    def get_query(self) -> str:
        return f"""
            {{
                reservationByPk(pk: {self.reservation.pk}) {{
                    reserveeFirstName
                    reserveeLastName
                    reserveePhone
                    name
                }}
            }}
        """

    def test_getting_reservation_by_pk(self):
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_query())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_getting_reservation_of_another_user_by_pk_does_not_reveal_reservee_name(
        self,
    ):
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)
        response = self.query(self.get_query())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)
