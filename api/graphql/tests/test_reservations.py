import datetime
import json
from unittest.mock import patch

import freezegun
import snapshottest
from assertpy import assert_that
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.base import GrapheneTestCaseBase
from applications.models import CUSTOMER_TYPES, PRIORITY_CONST, City
from applications.tests.factories import ApplicationRoundFactory
from opening_hours.enums import State
from opening_hours.hours import TimeElement
from opening_hours.tests.test_get_periods import get_mocked_periods
from reservation_units.models import ReservationUnit
from reservation_units.tests.factories import (
    ReservationUnitCancellationRuleFactory,
    ReservationUnitFactory,
)
from reservations.models import (
    STATE_CHOICES,
    AgeGroup,
    Reservation,
    ReservationMetadataField,
    ReservationMetadataSet,
)
from reservations.tests.factories import (
    ReservationCancelReasonFactory,
    ReservationFactory,
    ReservationPurposeFactory,
)
from spaces.tests.factories import SpaceFactory

DEFAULT_TIMEZONE = get_default_timezone()


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationTestCaseBase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.space = SpaceFactory()
        cls.reservation_unit = ReservationUnitFactory(
            spaces=[cls.space],
            name="resunit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
        )
        cls.purpose = ReservationPurposeFactory(name="purpose")

    def get_mocked_opening_hours(self):
        resource_id = f"{settings.HAUKI_ORIGIN_ID}:{self.reservation_unit.uuid}"
        return [self._get_single_opening_hour_block(resource_id, resource_id)]

    def _get_single_opening_hour_block(self, resource_id, origin_id):
        return {
            "timezone": DEFAULT_TIMEZONE,
            "resource_id": resource_id,
            "origin_id": str(self.reservation_unit.uuid),
            "date": datetime.date.today(),
            "times": [
                TimeElement(
                    start_time=datetime.time(hour=6),
                    end_time=datetime.time(hour=22),
                    end_time_on_next_day=False,
                    resource_state=State.WITH_RESERVATION,
                    periods=[],
                ),
            ],
        }


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
@patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@patch(
    "opening_hours.hours.get_periods_for_resource", return_value=get_mocked_periods()
)
class ReservationCreateTestCase(ReservationTestCaseBase):
    def get_create_query(self):
        return """
            mutation createReservation($input: ReservationCreateMutationInput!) {
                createReservation(input: $input) {
                    reservation {
                        pk
                        priority
                        calendarUrl
                    }
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_input_data(self):
        return {
            "reserveeType": "individual",
            "reserveeFirstName": "John",
            "reserveeLastName": "Doe",
            "reserveeOrganisationName": "Test Organisation ry",
            "reserveePhone": "+358123456789",
            "reserveeEmail": "john.doe@example.com",
            "reserveeId": "2882333-2",
            "reserveeIsUnregisteredAssociation": False,
            "reserveeAddressStreet": "Mannerheimintie 2",
            "reserveeAddressCity": "Helsinki",
            "reserveeAddressZip": "00100",
            "billingFirstName": "Jane",
            "billingLastName": "Doe",
            "billingPhone": "+358234567890",
            "billingEmail": "jane.doe@example.com",
            "billingAddressStreet": "Auratie 12B",
            "billingAddressCity": "Turku",
            "billingAddressZip": "20100",
            "homeCityPk": City.objects.create(name="Helsinki").pk,
            "ageGroupPk": AgeGroup.objects.create(minimum=18, maximum=30).pk,
            "applyingForFreeOfCharge": True,
            "freeOfChargeReason": "Some reason here.",
            "name": "Test reservation",
            "description": "Test description",
            "numPersons": 1,
            "purposePk": self.purpose.pk,
            "begin": datetime.datetime.now().strftime("%Y%m%dT%H%M%SZ"),
            "end": (datetime.datetime.now() + datetime.timedelta(hours=1)).strftime(
                "%Y%m%dT%H%M%SZ"
            ),
            "reservationUnitPks": [self.reservation_unit.pk],
        }

    def setUp(self):
        super().setUp()
        self.reservation_unit = ReservationUnitFactory(
            spaces=[self.space],
            name="resunit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            buffer_time_before=datetime.timedelta(minutes=30),
            buffer_time_after=datetime.timedelta(minutes=30),
        )

    def test_creating_reservation_succeed(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("reservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.user).is_equal_to(self.regular_joe)
        assert_that(reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        assert_that(reservation.priority).is_equal_to(PRIORITY_CONST.PRIORITY_MEDIUM)
        assert_that(reservation.reservee_first_name).is_equal_to(
            input_data["reserveeFirstName"]
        )
        assert_that(reservation.reservee_last_name).is_equal_to(
            input_data["reserveeLastName"]
        )
        assert_that(reservation.reservee_phone).is_equal_to(input_data["reserveePhone"])
        assert_that(reservation.name).is_equal_to(input_data["name"])
        assert_that(reservation.description).is_equal_to(input_data["description"])
        assert_that(reservation.purpose).is_equal_to(self.purpose)
        assert_that(reservation.buffer_time_after).is_equal_to(
            self.reservation_unit.buffer_time_after
        )
        assert_that(reservation.buffer_time_before).is_equal_to(
            self.reservation_unit.buffer_time_before
        )

    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler"
        + ".ReservationUnitReservationScheduler.is_reservation_unit_open"
    )
    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler."
        + "ReservationUnitReservationScheduler.get_conflicting_open_application_round"
    )
    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler."
        + "ReservationUnitReservationScheduler.get_reservation_unit_possible_start_times"
    )
    def test_creating_reservation_copies_max_buffer_times_from_multiple_reservation_units(
        self,
        mock_get_reservation_unit_possible_start_times,
        mock_get_conflicting_open_application_round,
        mock_is_open,
        mock_periods,
        mock_opening_hours,
    ):
        mock_is_open.return_value = True
        mock_get_conflicting_open_application_round.return_value = None
        mock_get_reservation_unit_possible_start_times.return_value = [
            datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        ]

        res_unit_too = ReservationUnitFactory(
            buffer_time_before=datetime.timedelta(minutes=90),
            buffer_time_after=None,
        )
        res_unit_another = ReservationUnitFactory(
            buffer_time_before=None,
            buffer_time_after=datetime.timedelta(minutes=15),
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["reservationUnitPks"].extend([res_unit_too.id, res_unit_another.id])
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("reservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.buffer_time_after).is_equal_to(
            self.reservation_unit.buffer_time_after
        )
        assert_that(reservation.buffer_time_before).is_equal_to(
            res_unit_too.buffer_time_before
        )

    def test_creating_reservation_without_optional_fields_succeeds(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        optional_fields = [
            "reserveeType",
            "reserveeFirstName",
            "reserveeLastName",
            "reserveeOrganisationName",
            "reserveePhone",
            "reserveeEmail",
            "reserveeId",
            "reserveeIsUnregisteredAssociation",
            "reserveeAddressStreet",
            "reserveeAddressCity",
            "reserveeAddressZip",
            "billingFirstName",
            "billingLastName",
            "billingPhone",
            "billingEmail",
            "billingAddressStreet",
            "billingAddressCity",
            "billingAddressZip",
            "homeCityPk",
            "ageGroupPk",
            "applyingForFreeOfCharge",
            "freeOfChargeReason",
            "name",
            "description",
            "numPersons",
            "purposePk",
        ]
        for field in optional_fields:
            input_data.pop(field)
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(Reservation.objects.exists()).is_true()

    def test_creating_reservation_price_fails(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["price"] = 10
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Reservation.objects.exists()).is_false()

    def test_creating_reservation_with_pk_fails(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["pk"] = 9999
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(Reservation.objects.exists()).is_false()

    def test_create_fails_when_overlapping_reservation(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(),
            end=datetime.datetime.now() + datetime.timedelta(hours=2),
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"]
        ).contains("Overlapping reservations are not allowed.")

    def test_create_fails_when_buffer_time_overlaps_reservation_before(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now() - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_after=datetime.timedelta(hours=1, minutes=1),
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains("before this has buffer time which overlaps this reservation.")

    def test_create_fails_when_buffer_time_overlaps_reservation_after(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now() + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_before=datetime.timedelta(hours=1, minutes=1),
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains("after this has buffer time which overlaps this reservation.")

    def test_create_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_before(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.buffer_time_before = datetime.timedelta(
            hours=1, minutes=1
        )
        self.reservation_unit.save()
        begin = datetime.datetime.now() - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains(
            "Reservation unit buffer time before overlaps with current begin time."
        )

    def test_create_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_after(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.buffer_time_after = datetime.timedelta(hours=1, minutes=1)
        self.reservation_unit.save()
        begin = datetime.datetime.now() + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains("Reservation unit buffer time after overlaps with current end time.")

    def test_create_fails_when_reservation_unit_closed_on_selected_time(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        input_data = self.get_valid_input_data()
        today = datetime.date.today()
        begin = datetime.datetime(today.year, today.month, today.day, 21, 0)
        end = begin + datetime.timedelta(hours=2)
        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains("Reservation unit is not open within desired reservation time.")

    def test_create_fails_when_reservation_unit_in_open_application_round(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        ApplicationRoundFactory(
            reservation_units=[self.reservation_unit],
            reservation_period_begin=datetime.date.today(),
            reservation_period_end=datetime.date.today() + datetime.timedelta(days=10),
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains("One or more reservation units are in open application round.")

    def test_create_fails_when_reservation_unit_max_reservation_duration_exceeds(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.max_reservation_duration = datetime.timedelta(minutes=30)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains(
            "Reservation duration exceeds one or more reservation unit's maximum duration."
        )

    def test_create_fails_when_reservation_unit_min_reservation_duration_subsides(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.max_reservation_duration = None
        self.reservation_unit.min_reservation_duration = datetime.timedelta(hours=2)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains(
            "Reservation duration less than one or more reservation unit's minimum duration."
        )

    def test_create_succeeds_when_start_time_matches_reservation_start_interval(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        intervals = [
            value for value, _ in ReservationUnit.RESERVATION_START_INTERVAL_CHOICES
        ]
        for interval, interval_minutes in zip(intervals, [15, 30, 60, 90]):
            input_data = self.get_valid_input_data()
            self.reservation_unit.reservation_start_interval = interval
            self.reservation_unit.save(update_fields=["reservation_start_interval"])
            begin = datetime.datetime.now() + datetime.timedelta(
                minutes=interval_minutes
            )
            input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            payload = content.get("data").get("createReservation", {})
            assert_that(payload.get("errors")).is_none()
            Reservation.objects.get(pk=payload["reservation"]["pk"]).delete()

    def test_create_fails_when_start_time_does_not_match_reservation_start_interval(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        intervals = [
            value for value, _ in ReservationUnit.RESERVATION_START_INTERVAL_CHOICES
        ]
        for interval, interval_minutes in zip(intervals, [15, 30, 60, 90]):
            input_data = self.get_valid_input_data()
            self.reservation_unit.reservation_start_interval = interval
            self.reservation_unit.save(update_fields=["reservation_start_interval"])
            begin = datetime.datetime.now() + datetime.timedelta(
                minutes=interval_minutes + 1
            )
            input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            payload = content.get("data").get("createReservation", {})
            assert_that(payload.get("errors")).is_not_none()
            assert_that(payload.get("errors")[0]["messages"]).contains(
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes."
            )

    def test_create_fails_when_reservation_unit_reservation_begin_in_future(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_begins = datetime.datetime.now(
            tz=DEFAULT_TIMEZONE
        ) + datetime.timedelta(days=10)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains("Reservation unit is not reservable within this reservation time.")

    def test_create_fails_when_reservation_unit_reservation_end_in_past(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_ends = datetime.datetime.now(
            tz=DEFAULT_TIMEZONE
        ) - datetime.timedelta(days=10)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")[0]["messages"][0]
        ).contains("Reservation unit is not reservable within this reservation time.")

    def test_create_success_when_reservation_unit_reservation_begin_in_past(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_begins = datetime.datetime.now(
            tz=DEFAULT_TIMEZONE
        ) - datetime.timedelta(days=10)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_none()
        reservation = Reservation.objects.filter(
            id=content.get("data").get("createReservation").get("reservation").get("pk")
        ).first()
        assert_that(reservation).is_not_none()

    def test_create_success_when_reservation_unit_reservation_end_in_future(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_ends = datetime.datetime.now(
            tz=DEFAULT_TIMEZONE
        ) + datetime.timedelta(days=10)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("errors")
        ).is_none()
        reservation = Reservation.objects.filter(
            id=content.get("data").get("createReservation").get("reservation").get("pk")
        ).first()
        assert_that(reservation).is_not_none()

    def test_create_fails_when_not_logged_in(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "No permission to mutate"
        )

    def test_create_success_when_reservation_date_over_next_spring(
        self, mock_periods, mock_opening_hours
    ):
        """In reservation creation it is needed to use opening_hours_end date
        parameter in ReservationUnitReservationScheduler initialization to get
        the possible opening hours from beyond next spring which is what the scheduler
        class defaults to.
        """
        opening_hours_data = self.get_mocked_opening_hours()
        opening_hours_data[0]["date"] = datetime.date(2022, 6, 15)
        mock_opening_hours.return_value = opening_hours_data

        res_start = datetime.datetime(2022, 6, 15, 15, 0)
        valid_data = self.get_valid_input_data()
        valid_data["begin"] = res_start.strftime("%Y%m%dT%H%M%SZ")
        valid_data["end"] = (res_start + datetime.timedelta(hours=1)).strftime(
            "%Y%m%dT%H%M%SZ"
        )
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=valid_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("createReservation").get("reservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@patch(
    "opening_hours.hours.get_periods_for_resource", return_value=get_mocked_periods()
)
class ReservationUpdateTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.reservation_begin = datetime.datetime.now(tz=get_default_timezone())
        self.reservation_end = datetime.datetime.now(
            tz=get_default_timezone()
        ) + datetime.timedelta(hours=1)
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=self.reservation_begin,
            end=self.reservation_end,
            state=STATE_CHOICES.CREATED,
            user=self.regular_joe,
            priority=100,
            unit_price=10,
            tax_percentage_value=24,
            price=10,
        )

    def _create_metadata_set(self):
        supported_fields = ReservationMetadataField.objects.filter(
            field_name__in=[
                "reservee_first_name",
                "reservee_last_name",
                "reservee_phone",
                "home_city",
                "age_group",
            ]
        )
        required_fields = ReservationMetadataField.objects.filter(
            field_name__in=[
                "reservee_first_name",
                "reservee_last_name",
                "home_city",
                "age_group",
            ]
        )
        metadata_set = ReservationMetadataSet.objects.create(name="Test form")
        metadata_set.supported_fields.set(supported_fields)
        metadata_set.required_fields.set(required_fields)
        return metadata_set

    def get_update_query(self):
        return """
            mutation updateReservation($input: ReservationUpdateMutationInput!) {
                updateReservation(input: $input) {
                    reservation {
                        pk
                        priority
                        calendarUrl
                    }
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_update_data(self):
        return {
            "pk": self.reservation.pk,
            "priority": 200,
            "begin": (self.reservation_begin + datetime.timedelta(hours=1)).strftime(
                "%Y%m%dT%H%M%SZ"
            ),
            "end": (self.reservation_end + datetime.timedelta(hours=1)).strftime(
                "%Y%m%dT%H%M%SZ"
            ),
        }

    def test_updating_reservation_succeed(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_update_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("reservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.user).is_equal_to(self.regular_joe)
        assert_that(reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        assert_that(reservation.priority).is_equal_to(
            self.get_valid_update_data()["priority"]
        )
        assert_that(reservation.begin).is_equal_to(
            self.reservation_begin + datetime.timedelta(hours=1)
        )
        assert_that(reservation.end).is_equal_to(
            (self.reservation_end + datetime.timedelta(hours=1))
        )

    def test_updating_reservation_with_pk_fails(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        new_pk = 9999
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data["pk"] = new_pk
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(Reservation.objects.filter(pk=new_pk)).is_false()

    def test_updating_reservation_with_price_fails(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data["price"] = 0
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.price).is_not_equal_to(0)

    def test_updating_reservation_with_invalid_reservee_type_fails(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        invalid_reservee_type = "invalid"
        data = self.get_valid_update_data()
        data["reserveeType"] = invalid_reservee_type
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.reservee_type).is_not_equal_to(
            invalid_reservee_type
        )

    def test_update_fails_when_overlapping_reservation(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(),
            end=datetime.datetime.now() + datetime.timedelta(hours=2),
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_update_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"]
        ).contains("Overlapping reservations are not allowed.")

    def test_update_fails_when_buffer_time_overlaps_reservation_before(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now() - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_after=datetime.timedelta(hours=1, minutes=1),
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(),
            input_data={"pk": self.reservation.id, "priority": 200},
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains("before this has buffer time which overlaps this reservation.")
        self.reservation.refresh_from_db()
        assert_that(self.reservation.priority).is_equal_to(100)

    def test_update_fails_when_buffer_time_overlaps_reservation_after(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now() + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_before=datetime.timedelta(hours=1, minutes=1),
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_update_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains("after this has buffer time which overlaps this reservation.")

    def test_update_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_before(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.buffer_time_before = datetime.timedelta(
            hours=1, minutes=1
        )
        self.reservation_unit.save()
        begin = self.reservation_begin - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data.pop("begin")
        input_data.pop("end")
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains(
            "Reservation unit buffer time before overlaps with current begin time."
        )

    def test_update_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_after(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.buffer_time_after = datetime.timedelta(hours=1, minutes=1)
        self.reservation_unit.save()
        begin = datetime.datetime.now() + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_update_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains("Reservation unit buffer time after overlaps with current end time.")

    def test_update_fails_when_reservation_unit_closed_on_selected_time(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        input_data = self.get_valid_update_data()
        today = datetime.date.today()
        begin = datetime.datetime(today.year, today.month, today.day, 21, 0)
        end = begin + datetime.timedelta(hours=2)
        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains("Reservation unit is not open within desired reservation time.")

    def test_update_fails_when_reservation_unit_in_open_application_round(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        ApplicationRoundFactory(
            reservation_units=[self.reservation_unit],
            reservation_period_begin=datetime.date.today(),
            reservation_period_end=datetime.date.today() + datetime.timedelta(days=10),
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_update_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains("One or more reservation units are in open application round.")

    def test_update_fails_when_reservation_unit_max_reservation_duration_exceeds(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.max_reservation_duration = datetime.timedelta(minutes=30)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_update_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains(
            "Reservation duration exceeds one or more reservation unit's maximum duration."
        )

    def test_update_fails_when_reservation_unit_min_reservation_duration_subsides(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.max_reservation_duration = None
        self.reservation_unit.min_reservation_duration = datetime.timedelta(hours=2)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_update_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains(
            "Reservation duration less than one or more reservation unit's minimum duration."
        )

    def test_update_fails_when_not_permission(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        citizen = get_user_model().objects.create(
            username="citzen",
            first_name="citi",
            last_name="zen",
            email="zen.citi@foo.com",
        )
        res = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(),
            end=datetime.datetime.now() + datetime.timedelta(hours=2),
            state=STATE_CHOICES.CREATED,
            user=citizen,
        )
        input_data = self.get_valid_update_data()
        input_data["pk"] = res.pk
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "No permission to mutate"
        )

    def test_update_to_cancelled_success(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        input_data = self.get_valid_update_data()
        input_data["state"] = STATE_CHOICES.CANCELLED
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.state).is_equal_to(STATE_CHOICES.CANCELLED)

    def test_update_to_confirmed_fails(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        input_data = self.get_valid_update_data()
        input_data["state"] = STATE_CHOICES.CONFIRMED
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()

        err_msg = f"Setting the reservation state to {STATE_CHOICES.CONFIRMED} is not allowed."
        assert_that(
            content.get("data").get("updateReservation").get("errors")[0]["messages"][0]
        ).contains(err_msg)

    def test_update_succeeds_when_reservation_unit_has_no_metadata_set(
        self, mock_periods, mock_opening_hours
    ):
        self.reservation_unit.metadata_set = None
        self.reservation_unit.save(update_fields=["metadata_set"])
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.reservee_first_name).is_equal_to(
            input_data["reserveeFirstName"]
        )

    def test_update_succeeds_when_all_required_fields_are_filled(
        self, mock_periods, mock_opening_hours
    ):
        self.reservation_unit.metadata_set = self._create_metadata_set()
        self.reservation_unit.save(update_fields=["metadata_set"])
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        home_city = City.objects.create(name="Helsinki")
        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["homeCityPk"] = home_city.pk
        input_data["ageGroupPk"] = age_group.pk
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.reservee_first_name).is_equal_to(
            input_data["reserveeFirstName"]
        )
        assert_that(self.reservation.reservee_last_name).is_equal_to(
            input_data["reserveeLastName"]
        )
        assert_that(self.reservation.reservee_phone).is_equal_to(
            input_data["reserveePhone"]
        )
        assert_that(self.reservation.home_city).is_equal_to(home_city)
        assert_that(self.reservation.age_group).is_equal_to(age_group)

    def test_update_fails_when_some_required_fields_are_missing(
        self, mock_periods, mock_opening_hours
    ):
        self.reservation_unit.metadata_set = self._create_metadata_set()
        self.reservation_unit.save(update_fields=["metadata_set"])
        home_city = City.objects.create(name="Helsinki")
        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        input_data = self.get_valid_update_data()
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["homeCityPk"] = home_city.pk
        input_data["ageGroupPk"] = age_group.pk
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.reservee_last_name).is_not_equal_to(
            input_data["reserveeLastName"]
        )
        assert_that(self.reservation.reservee_phone).is_not_equal_to(
            input_data["reserveePhone"]
        )
        assert_that(self.reservation.home_city).is_not_equal_to(home_city)
        assert_that(self.reservation.age_group).is_not_equal_to(age_group)


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@patch("opening_hours.utils.opening_hours_client.get_opening_hours")
@patch(
    "opening_hours.hours.get_periods_for_resource", return_value=get_mocked_periods()
)
class ReservationConfirmTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=(
                datetime.datetime.now(tz=get_default_timezone())
                + datetime.timedelta(hours=1)
            ),
            state=STATE_CHOICES.CREATED,
            user=self.regular_joe,
        )

    def get_confirm_query(self):
        return """
            mutation confirmReservation($input: ReservationConfirmMutationInput!) {
                confirmReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_confirm_data(self):
        return {"pk": self.reservation.pk}

    def test_confirm_reservation_changes_state(self, mock_periods, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_none()
        assert_that(confirm_data.get("state")).is_equal_to(STATE_CHOICES.CONFIRMED)
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_confirm_reservation_fails_if_state_is_not_created(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        self.reservation.state = STATE_CHOICES.DENIED
        self.reservation.save()
        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        confirm_data = content.get("data").get("confirmReservation")
        assert_that(confirm_data.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)

    def test_confirm_reservation_fails_on_wrong_user(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        input_data = self.get_valid_confirm_data()
        response = self.query(self.get_confirm_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)

    def test_confirm_reservation_updates_confirmed_at(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_confirm_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        self.query(self.get_confirm_query(), input_data=input_data)
        self.reservation.refresh_from_db()
        assert_that(self.reservation.confirmed_at).is_equal_to(
            datetime.datetime(2021, 10, 12, 12).astimezone()
        )


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationCancellationTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.cancel_reason = ReservationCancelReasonFactory(reason="good_reason")
        self.cancel_rule = ReservationUnitCancellationRuleFactory(
            name="default rule",
            can_be_cancelled_time_before=datetime.timedelta(hours=0),
            needs_handling=False,
        )
        self.reservation_unit.cancellation_rule = self.cancel_rule
        self.reservation_unit.save()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=(
                datetime.datetime.now(tz=get_default_timezone())
                + datetime.timedelta(hours=1)
            ),
            state=STATE_CHOICES.CONFIRMED,
            user=self.regular_joe,
        )

    def get_cancel_query(self):
        return """
            mutation cancelReservation($input: ReservationCancellationMutationInput!) {
                cancelReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_cancel_data(self):
        return {"pk": self.reservation.pk, "cancelReasonPk": self.cancel_reason.id}

    def test_cancel_reservation_changes_state(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        assert_that(cancel_data.get("state")).is_equal_to(
            STATE_CHOICES.CANCELLED.upper()
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CANCELLED)

    def test_cancel_reservation_adds_reason(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        assert_that(cancel_data.get("state")).is_equal_to(
            STATE_CHOICES.CANCELLED.upper()
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.cancel_reason).is_equal_to(self.cancel_reason)

    def test_cancel_reservation_adds_cancel_details(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        details = "wantitso"
        input_data["cancelDetails"] = details
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        assert_that(cancel_data.get("state")).is_equal_to(
            STATE_CHOICES.CANCELLED.upper()
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.cancel_details).is_equal_to(details)

    def test_cancel_reservation_fails_if_state_is_not_confirmed(self):
        self.client.force_login(self.regular_joe)
        self.reservation.state = STATE_CHOICES.CREATED
        self.reservation.save()
        input_data = self.get_valid_cancel_data()
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)

    def test_cancel_reservation_fails_if_cancel_reason_not_given(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        input_data.pop("cancelReasonPk")
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_cancel_reservation_fails_on_wrong_user(self):
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        input_data = self.get_valid_cancel_data()
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_cancel_reservation_fails_with_rules_time_is_due(self):
        rule = ReservationUnitCancellationRuleFactory(
            can_be_cancelled_time_before=datetime.timedelta(hours=12)
        )
        self.reservation_unit.cancellation_rule = rule
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_cancel_reservation_succeed_with_rule_set_and_in_time(self):
        rule = ReservationUnitCancellationRuleFactory(
            can_be_cancelled_time_before=datetime.timedelta(hours=1)
        )
        self.reservation_unit.cancellation_rule = rule
        self.reservation_unit.save()

        now = datetime.datetime.now(tz=get_default_timezone())
        reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=now + datetime.timedelta(hours=1),
            end=(now + datetime.timedelta(hours=2)),
            state=STATE_CHOICES.CONFIRMED,
            user=self.regular_joe,
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        input_data["pk"] = reservation.id
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        reservation.refresh_from_db()
        assert_that(reservation.state).is_equal_to(STATE_CHOICES.CANCELLED)

    def test_cancel_reservation_fails_when_reservation_in_past(self):
        now = datetime.datetime.now(tz=get_default_timezone())
        reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=now - datetime.timedelta(hours=2),
            end=now - datetime.timedelta(hours=1),
            state=STATE_CHOICES.CONFIRMED,
            user=self.regular_joe,
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        input_data["pk"] = reservation.id
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_not_none()
        reservation.refresh_from_db()
        assert_that(reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

        def test_cancel_fails_if_no_rule(self):
            self.reservation_unit.cancellation_rule = None
            self.reservation_unit.save()

            self.client.force_login(self.regular_joe)
            assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
            input_data = self.get_valid_cancel_data()
            response = self.query(self.get_cancel_query(), input_data=input_data)

            content = json.loads(response.content)
            cancel_data = content.get("data").get("cancelReservation")
            assert_that(cancel_data.get("errors")).is_not_none()
            self.reservation.refresh_from_db()
            assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)


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
