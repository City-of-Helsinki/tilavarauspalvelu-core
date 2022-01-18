import datetime
import json

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from applications.models import CUSTOMER_TYPES, City
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import STATE_CHOICES, AgeGroup
from reservations.tests.factories import (
    ReservationFactory,
    ReservationMetadataSetFactory,
)


class ReservationQueryTestCase(ReservationTestCaseBase):
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
        self.maxDiff = None
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


class ReservationByPkTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            reservee_first_name="Joe",
            reservee_last_name="Regular",
            reservee_phone="+358123456789",
            name="Test reservation",
            user=self.regular_joe,
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
