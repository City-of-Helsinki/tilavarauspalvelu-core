import datetime
import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

import freezegun
from assertpy import assert_that
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.extensions.validation_errors import ValidationErrorCodes
from api.graphql.tests.test_reservations.base import DEFAULT_TIMEZONE, ReservationTestCaseBase
from applications.choices import PriorityChoice
from applications.models import City
from reservation_units.models import (
    PriceUnit,
    PricingStatus,
    PricingType,
    ReservationKind,
    ReservationUnit,
)
from reservations.choices import ReservationStateChoice, ReservationTypeChoice
from reservations.models import AgeGroup, Reservation
from tests.factories import (
    ApplicationRoundFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    TaxPercentageFactory,
)


def get_profile_data():
    return {"data": {"myProfile": {"firstName": "John", "lastName": "Doe"}}}


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@patch("opening_hours.utils.opening_hours_client.get_opening_hours")
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
            "end": (datetime.datetime.now() + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%SZ"),
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

    def test_creating_reservation_succeed(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.user).is_equal_to(self.regular_joe)
        assert_that(reservation.state).is_equal_to(ReservationStateChoice.CREATED)
        assert_that(reservation.priority).is_equal_to(PriorityChoice.MEDIUM)
        assert_that(reservation.reservee_first_name).is_equal_to(input_data["reserveeFirstName"])
        assert_that(reservation.reservee_last_name).is_equal_to(input_data["reserveeLastName"])
        assert_that(reservation.reservee_phone).is_equal_to(input_data["reserveePhone"])
        assert_that(reservation.name).is_equal_to(input_data["name"])
        assert_that(reservation.description).is_equal_to(input_data["description"])
        assert_that(reservation.purpose).is_equal_to(self.purpose)
        assert_that(reservation.buffer_time_after).is_equal_to(self.reservation_unit.buffer_time_after)
        assert_that(reservation.buffer_time_before).is_equal_to(self.reservation_unit.buffer_time_before)

    @override_settings(PREFILL_RESERVATION_WITH_PROFILE_DATA=True)
    @patch(
        "users.utils.open_city_profile.basic_info_resolver.requests.get",
        return_value=MagicMock(status_code=200, json=MagicMock(return_value=get_profile_data())),
    )
    def test_reservation_succeed_with_minimum_data(self, mock_profile_call, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = {
            "name": "Test reservation",
            "description": "Test description",
            "begin": datetime.datetime.now().strftime("%Y%m%dT%H%M%SZ"),
            "end": (datetime.datetime.now() + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%SZ"),
            "reservationUnitPks": [self.reservation_unit.pk],
        }

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.user).is_equal_to(self.regular_joe)
        assert_that(reservation.state).is_equal_to(ReservationStateChoice.CREATED)
        assert_that(reservation.priority).is_equal_to(PriorityChoice.MEDIUM)

        assert_that(reservation.buffer_time_after).is_equal_to(self.reservation_unit.buffer_time_after)
        assert_that(reservation.buffer_time_before).is_equal_to(self.reservation_unit.buffer_time_before)

    def test_creating_reservation_with_reservation_language_succeed(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["reserveeLanguage"] = "fi"
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.reservee_language).is_equal_to("fi")

    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler."
        "ReservationUnitReservationScheduler.is_reservation_unit_open"
    )
    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler."
        "ReservationUnitReservationScheduler.get_conflicting_open_application_round"
    )
    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler."
        "ReservationUnitReservationScheduler.get_reservation_unit_possible_start_times"
    )
    def test_creating_reservation_copies_max_buffer_times_from_multiple_reservation_units(
        self,
        mock_get_reservation_unit_possible_start_times,
        mock_get_conflicting_open_application_round,
        mock_is_open,
        mock_opening_hours,
    ):
        mock_is_open.return_value = True
        mock_get_conflicting_open_application_round.return_value = None
        mock_get_reservation_unit_possible_start_times.return_value = [datetime.datetime.now(tz=DEFAULT_TIMEZONE)]
        sku = "340026__2652000155___44_10000100"
        self.reservation_unit.sku = sku
        self.reservation_unit.save(update_fields=["sku"])
        res_unit_too = ReservationUnitFactory(
            buffer_time_before=datetime.timedelta(minutes=90),
            buffer_time_after=None,
            sku=sku,
        )
        res_unit_another = ReservationUnitFactory(
            buffer_time_before=None,
            buffer_time_after=datetime.timedelta(minutes=15),
            sku=sku,
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["reservationUnitPks"].extend([res_unit_too.id, res_unit_another.id])
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.buffer_time_after).is_equal_to(self.reservation_unit.buffer_time_after)
        assert_that(reservation.buffer_time_before).is_equal_to(res_unit_too.buffer_time_before)

    def test_creating_reservation_without_optional_fields_succeeds(self, mock_opening_hours):
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

    def test_creating_reservation_price_fails(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["price"] = 10
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(Reservation.objects.exists()).is_false()

    def test_creating_reservation_with_pk_fails(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["pk"] = 9999
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(Reservation.objects.exists()).is_false()

    def test_create_fails_when_overlapping_reservation(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=DEFAULT_TIMEZONE),
            end=datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(hours=2),
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to("Overlapping reservations are not allowed.")
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("OVERLAPPING_RESERVATIONS")

    def test_create_fails_when_buffer_time_overlaps_reservation_before(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_after=datetime.timedelta(hours=1, minutes=1),
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation overlaps with reservation before due to buffer time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_OVERLAP")

    def test_create_succeed_when_buffer_time_overlaps_blocked_reservation_before(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_after=datetime.timedelta(hours=1, minutes=1),
            state=ReservationStateChoice.CONFIRMED,
            type=ReservationTypeChoice.BLOCKED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

    def test_create_fails_when_buffer_time_overlaps_reservation_after(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_before=datetime.timedelta(hours=1, minutes=1),
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation overlaps with reservation after due to buffer time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_OVERLAP")

    def test_create_succeed_when_buffer_time_overlaps_block_reservation_after(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            buffer_time_before=datetime.timedelta(hours=1, minutes=1),
            state=ReservationStateChoice.CONFIRMED,
            type=ReservationTypeChoice.BLOCKED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

    def test_create_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_before(
        self, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.buffer_time_before = datetime.timedelta(hours=1, minutes=1)
        self.reservation_unit.save()
        begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation overlaps with reservation before due to buffer time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_OVERLAP")

    def test_create_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_after(
        self, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.buffer_time_after = datetime.timedelta(hours=1, minutes=1)
        self.reservation_unit.save()
        begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=begin,
            end=end,
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation overlaps with reservation after due to buffer time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_OVERLAP")

    def test_create_fails_when_reservation_unit_closed_on_selected_time(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        input_data = self.get_valid_input_data()
        today = datetime.date.today()
        begin = datetime.datetime(today.year, today.month, today.day, 21, 0, tzinfo=get_default_timezone())
        end = begin + datetime.timedelta(hours=2)
        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit is not open within desired reservation time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_IS_NOT_OPEN")

    def test_create_succeed_when_reservation_unit_closed_on_selected_time_and_opening_hours_are_ignored(
        self, mock_opening_hours
    ):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        input_data = self.get_valid_input_data()
        today = datetime.date.today()
        begin = datetime.datetime(today.year, today.month, today.day, 21, 0, tzinfo=get_default_timezone())
        end = begin + datetime.timedelta(hours=2)
        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        reservation_id = content.get("data").get("createReservation").get("reservation").get("pk")
        assert_that(reservation_id).is_greater_than_or_equal_to(1)
        saved_reservation = Reservation.objects.get(pk=reservation_id)
        assert_that(saved_reservation).is_not_none()

    def test_create_fails_when_reservation_unit_in_open_application_round(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        ApplicationRoundFactory(
            reservation_units=[self.reservation_unit],
            reservation_period_begin=datetime.date.today(),
            reservation_period_end=datetime.date.today() + datetime.timedelta(days=10),
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "One or more reservation units are in open application round."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_IN_OPEN_ROUND")

    def test_create_fails_when_reservation_unit_max_reservation_duration_exceeds(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.max_reservation_duration = datetime.timedelta(minutes=30)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation duration exceeds one or more reservation unit's maximum duration."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_UNITS_MAX_DURATION_EXCEEDED"
        )

    def test_create_fails_when_reservation_unit_min_reservation_duration_subsides(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.max_reservation_duration = None
        self.reservation_unit.min_reservation_duration = datetime.timedelta(hours=2)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation duration less than one or more reservation unit's minimum duration."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED"
        )

    def test_create_succeeds_when_start_time_matches_reservation_start_interval(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        intervals = [value for value, _ in ReservationUnit.RESERVATION_START_INTERVAL_CHOICES]
        for interval, interval_minutes in zip(intervals, [15, 30, 60, 90]):
            input_data = self.get_valid_input_data()
            self.reservation_unit.reservation_start_interval = interval
            self.reservation_unit.save(update_fields=["reservation_start_interval"])
            begin = datetime.datetime.now() + datetime.timedelta(minutes=interval_minutes)
            input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
            input_data["end"] = (begin + datetime.timedelta(minutes=interval_minutes)).strftime("%Y%m%dT%H%M%SZ")
            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            payload = content.get("data").get("createReservation", {})
            assert_that(payload.get("errors")).is_none()
            Reservation.objects.get(pk=payload["reservation"]["pk"]).delete()

    def test_create_fails_when_start_time_does_not_match_reservation_start_interval(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        intervals = [value for value, _ in ReservationUnit.RESERVATION_START_INTERVAL_CHOICES]
        for interval, interval_minutes in zip(intervals, [15, 30, 60, 90]):
            input_data = self.get_valid_input_data()
            self.reservation_unit.reservation_start_interval = interval
            self.reservation_unit.save(update_fields=["reservation_start_interval"])
            begin = datetime.datetime.now() + datetime.timedelta(minutes=interval_minutes + 1)
            end = begin + datetime.timedelta(minutes=interval_minutes)
            input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
            input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_not_none()
            assert_that(content.get("errors")[0]["message"]).is_equal_to(
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes."
            )
            assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
                "RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL"
            )

    def test_create_succeed_when_start_time_does_not_match_reservation_start_interval_and_opening_hours_are_ignored(
        self, mock_opening_hours
    ):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        intervals = [value for value, _ in ReservationUnit.RESERVATION_START_INTERVAL_CHOICES]
        for interval, interval_minutes in zip(intervals, [15, 90]):
            input_data = self.get_valid_input_data()
            self.reservation_unit.reservation_start_interval = interval
            self.reservation_unit.save(update_fields=["reservation_start_interval"])
            begin = datetime.datetime.now() + datetime.timedelta(minutes=interval_minutes + 1)
            input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
            input_data["end"] = (begin + datetime.timedelta(minutes=interval_minutes)).strftime("%Y%m%dT%H%M%SZ")
            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            payload = content.get("data").get("createReservation", {})
            assert_that(payload.get("errors")).is_none()
            reservation_id = payload.get("reservation").get("pk")
            assert_that(reservation_id).is_greater_than_or_equal_to(1)
            saved_reservation = Reservation.objects.get(pk=reservation_id)
            assert_that(saved_reservation).is_not_none()

    def test_create_fails_when_reservation_unit_reservation_begins_in_future(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_begins = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(
            days=10
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit is not reservable at current time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_NOT_RESERVABLE")

    def test_create_fails_when_reservation_unit_publish_begins_in_future(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.publish_begins = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(days=10)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit is not reservable at current time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_NOT_RESERVABLE")

    def test_create_fails_when_reservation_unit_reservation_ends_in_past(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_ends = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(
            days=10
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit is not reservable at current time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_NOT_RESERVABLE")

    def test_create_fails_reservation_unit_state_is_archived(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.is_archived = True
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit is not reservable due to status is ReservationUnitState.ARCHIVED."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_NOT_RESERVABLE")

    def test_create_fails_reservation_unit_state_is_draft(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.is_draft = True
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit is not reservable due to status is ReservationUnitState.DRAFT."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_NOT_RESERVABLE")

    def test_create_fails_when_reservation_unit_publish_ends_in_past(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.publish_ends = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(days=10)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit is not reservable at current time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_NOT_RESERVABLE")

    def test_create_success_when_reservation_unit_reservation_begin_in_past(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_begins = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(
            days=10
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        reservation = Reservation.objects.filter(
            id=content.get("data").get("createReservation").get("reservation").get("pk")
        ).first()
        assert_that(reservation).is_not_none()

    def test_create_success_when_reservation_unit_reservation_end_in_future(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_ends = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(
            days=10
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        reservation = Reservation.objects.filter(
            id=content.get("data").get("createReservation").get("reservation").get("pk")
        ).first()
        assert_that(reservation).is_not_none()

    def test_create_fails_when_not_logged_in(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")

    def test_create_success_when_reservation_date_over_next_spring(self, mock_opening_hours):
        """
        In reservation creation it is needed to use opening_hours_end date
        parameter in ReservationUnitReservationScheduler initialization to get
        the possible opening hours from beyond next spring which is what the scheduler
        class defaults to.
        """
        opening_hours_data = self.get_mocked_opening_hours()
        opening_hours_data[0]["date"] = datetime.date(2022, 6, 15)
        mock_opening_hours.return_value = opening_hours_data

        res_start = datetime.datetime(2022, 6, 15, 15, 0, tzinfo=get_default_timezone())
        valid_data = self.get_valid_input_data()
        valid_data["begin"] = res_start.strftime("%Y%m%dT%H%M%SZ")
        valid_data["end"] = (res_start + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%SZ")
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=valid_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()

    def test_creating_reservation_succeeds_when_under_max_reservations_per_user(self, mock_opening_hours):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        assert_that(Reservation.objects.exists()).is_true()

    def test_creating_reservation_fails_when_max_reservations_per_user_reached(self, mock_opening_hours):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])
        existing_reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now() + datetime.timedelta(hours=24),
            end=datetime.datetime.now() + datetime.timedelta(hours=25),
            state=ReservationStateChoice.CONFIRMED,
            user=self.regular_joe,
        )
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Maximum number of active reservations for this reservation unit exceeded."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "MAX_NUMBER_OF_ACTIVE_RESERVATIONS_EXCEEDED"
        )
        assert_that(Reservation.objects.exclude(pk=existing_reservation.pk).exists()).is_false()

    def test_old_reservations_are_not_counted_towards_max_reservations_per_user(self, mock_opening_hours):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now() - datetime.timedelta(hours=25),
            end=datetime.datetime.now() - datetime.timedelta(hours=24),
            state=ReservationStateChoice.CONFIRMED,
            user=self.regular_joe,
        )
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        assert_that(Reservation.objects.exists()).is_true()

    def test_reservations_from_other_runits_are_not_counted_towards_max_reservations_per_user(self, mock_opening_hours):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])

        other_reservation_unit = ReservationUnitFactory(
            spaces=[self.space],
            name="other resunit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            buffer_time_before=datetime.timedelta(minutes=30),
            buffer_time_after=datetime.timedelta(minutes=30),
        )

        ReservationFactory(
            reservation_unit=[other_reservation_unit],
            begin=datetime.datetime.now() + datetime.timedelta(hours=24),
            end=datetime.datetime.now() + datetime.timedelta(hours=25),
            state=ReservationStateChoice.CONFIRMED,
            user=self.regular_joe,
        )

        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now() - datetime.timedelta(hours=25),
            end=datetime.datetime.now() - datetime.timedelta(hours=24),
            state=ReservationStateChoice.CONFIRMED,
            user=self.regular_joe,
        )
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        assert_that(Reservation.objects.exists()).is_true()

    def test_creating_reservation_copies_sku_from_reservation_unit(self, mock_opening_hours):
        self.reservation_unit.sku = "340026__2652000155___44_10000117"
        self.reservation_unit.save(update_fields=["sku"])
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        reservation = Reservation.objects.get()
        assert_that(reservation.sku).is_equal_to(self.reservation_unit.sku)

    def test_creating_reservation_fails_if_sku_is_ambiguous(self, mock_opening_hours):
        resunit1 = ReservationUnitFactory(sku="340026__2652000155___44_10000001")
        resunit2 = ReservationUnitFactory(sku="340026__2652000155___44_10000002")
        input_data = self.get_valid_input_data()
        input_data["reservationUnitPks"] = [resunit1.pk, resunit2.pk]

        def get_mocked_opening_hours(origin_ids, *args):
            if str(resunit1.uuid) in origin_ids:
                return self.get_mocked_opening_hours(resunit1)
            return self.get_mocked_opening_hours(resunit2)

        mock_opening_hours.side_effect = get_mocked_opening_hours
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "An ambiguous SKU cannot be assigned for this reservation."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("AMBIGUOUS_SKU")

    def test_create_fails_when_reservation_unit_reservations_max_days_before_exceeds(self, mock_opening_hours):
        res_begin = datetime.datetime.now() + datetime.timedelta(days=181)
        mock_opening_hours.return_value = self.get_mocked_opening_hours(date=res_begin.date())
        self.reservation_unit.reservations_max_days_before = 180
        self.reservation_unit.save()

        data = self.get_valid_input_data()
        data["begin"] = res_begin.strftime("%Y%m%dT%H%M%SZ")
        data["end"] = (res_begin + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains("Reservation start time is earlier than")
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE"
        )

    def test_create_succeed_when_reservation_unit_reservations_max_days_before_in_limits(self, mock_opening_hours):
        self.reservation_unit.reservations_max_days_before = 180
        self.reservation_unit.save()
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()

    def test_create_fails_when_reservation_unit_reservations_min_days_before_subseeds(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservations_min_days_before = 1
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains("Reservation start time is less than")
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE"
        )

    def test_create_succeed_when_reservation_is_done_less_than_one_full_day_before(self, mock_opening_hours):
        reservation_begin = datetime.datetime(2021, 10, 13, 0, 0, 0, tzinfo=get_default_timezone())
        reservation_end = reservation_begin + datetime.timedelta(hours=1)

        mock_opening_hours.return_value = self.get_mocked_opening_hours(date=reservation_begin.date(), start_hour=0)

        self.reservation_unit.reservations_min_days_before = 1
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["begin"] = reservation_begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = reservation_end.strftime("%Y%m%dT%H%M%SZ")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()

        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()

    def test_create_succeed_when_reservation_unit_reservations_in_days_before_in_limits(self, mock_opening_hours):
        self.reservation_unit.reservations_min_days_before = 0
        self.reservation_unit.save()
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()

    def test_create_fails_when_reservation_unit_reservation_kind_is_season(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.reservation_kind = ReservationKind.SEASON
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains("reservation kind is SEASON")
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("RESERVATION_UNIT_TYPE_IS_SEASON")

    def test_creating_reservation_type_to_staff_succeed(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["type"] = ReservationTypeChoice.STAFF
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.type).is_equal_to(ReservationTypeChoice.STAFF)

    def test_creating_reservation_with_type_succeed(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["type"] = "blocked"
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.type).is_equal_to("blocked")

    def test_creating_fails_when_type_is_provided_without_permissions(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["type"] = "blocked"
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to("You don't have permissions to set type")

    def test_create_price_calculation_with_free_reservation_unit(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.price).is_zero()  # Free units should always be 0 €
        assert_that(reservation.non_subsidised_price).is_equal_to(
            reservation.price
        )  # Non subsidised price should copy of price
        assert_that(reservation.price_net).is_zero()
        assert_that(reservation.non_subsidised_price_net).is_equal_to(reservation.price_net)
        assert_that(reservation.unit_price).is_zero()
        assert_that(reservation.tax_percentage_value).is_zero()

    def test_create_price_calculation_with_fixed_price_reservation_unit(self, mock_opening_hours):
        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            highest_price_net=Decimal("3") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.price).is_equal_to(3.0)  # With fixed price unit, time is ignored
        assert_that(reservation.non_subsidised_price).is_close_to(reservation.price, 3)
        assert_that(reservation.unit_price).is_equal_to(3.0)
        assert_that(reservation.price_net).is_close_to(Decimal("3") / (1 + tax_percentage.decimal), 6)
        assert_that(reservation.non_subsidised_price_net).is_equal_to(reservation.price_net)
        assert_that(reservation.tax_percentage_value).is_equal_to(tax_percentage.value)

    def test_create_price_calculation_with_time_based_price_reservation_unit(self, mock_opening_hours):
        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
            lowest_price=1.0,
            lowest_price_net=Decimal("1") / (1 + tax_percentage.decimal),
            highest_price=3.0,
            highest_price_net=Decimal("3") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.price).is_equal_to(3.0 * 4)  # 1h reservation = 4 x 15 min = 4 x 3 €
        assert_that(reservation.non_subsidised_price).is_close_to(reservation.price, 3)
        assert_that(reservation.price_net).is_close_to((Decimal("3") * 4) / (1 + tax_percentage.decimal), 6)
        assert_that(reservation.non_subsidised_price_net).is_equal_to(reservation.price_net)
        assert_that(reservation.unit_price).is_equal_to(3.0)  # 1h reservation = 4 x 15 min = 4 x 3 €
        assert_that(reservation.tax_percentage_value).is_equal_to(tax_percentage.value)

    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler.ReservationUnitReservationScheduler.is_reservation_unit_open"
    )
    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler.ReservationUnitReservationScheduler.get_conflicting_open_application_round"
    )
    @patch(
        "reservation_units.utils.reservation_unit_reservation_scheduler.ReservationUnitReservationScheduler.get_reservation_unit_possible_start_times"
    )
    def test_create_price_calculation_with_multiple_units(
        self,
        mock_get_reservation_unit_possible_start_times,
        mock_get_conflicting_open_application_round,
        mock_is_open,
        mock_opening_hours,
    ):
        mock_is_open.return_value = True
        mock_get_conflicting_open_application_round.return_value = None
        mock_get_reservation_unit_possible_start_times.return_value = [datetime.datetime.now(tz=DEFAULT_TIMEZONE)]

        tax_percentage = TaxPercentageFactory()

        sku = "340026__2652000155___44_10000100"

        self.reservation_unit.sku = sku
        self.reservation_unit.save()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
            lowest_price=1.0,
            lowest_price_net=Decimal("1") / (1 + tax_percentage.decimal),
            highest_price=3.0,
            highest_price_net=Decimal("3") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        second_unit = ReservationUnitFactory(
            spaces=[self.space],
            name="second_unit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            buffer_time_before=datetime.timedelta(minutes=30),
            buffer_time_after=datetime.timedelta(minutes=30),
            sku=sku,
        )

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
            lowest_price=2.0,
            lowest_price_net=Decimal("2") / (1 + tax_percentage.decimal),
            highest_price=4.0,
            highest_price_net=Decimal("4") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=second_unit,
        )

        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_input_data()
        input_data["reservationUnitPks"] = [self.reservation_unit.pk, second_unit.pk]

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.price).is_equal_to(3.0 * 4 + 4.0 * 4)  # 1h reservation = 4 x 15 min from both units
        assert_that(reservation.non_subsidised_price).is_close_to(reservation.price, 6)
        assert_that(reservation.unit_price).is_equal_to(3.0)  # 3€ from from the first unit
        assert_that(reservation.tax_percentage_value).is_equal_to(tax_percentage.value)
        assert_that(reservation.price_net).is_close_to(reservation.price / (1 + tax_percentage.decimal), 6)
        assert_that(reservation.non_subsidised_price_net).is_equal_to(reservation.price_net)

    def test_create_price_calculation_with_future_pricing(self, mock_opening_hours):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            lowest_price_net=Decimal("1") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("3") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        ReservationUnitPricingFactory(
            begins=datetime.date.today() + datetime.timedelta(days=2),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=Decimal("4"),
            highest_price=Decimal("6"),
            lowest_price_net=Decimal("4") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("6") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_FUTURE,
            reservation_unit=self.reservation_unit,
        )

        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_input_data()
        input_data["begin"] = (datetime.datetime.now() + datetime.timedelta(days=2)).strftime("%Y%m%dT%H%M%SZ")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.price).is_equal_to(6.0)  # With fixed price unit, time is ignored
        assert_that(reservation.non_subsidised_price).is_close_to(reservation.price, 6)
        assert_that(reservation.price_net).is_close_to(6 / (1 + tax_percentage.decimal), 6)
        assert_that(reservation.unit_price).is_equal_to(6.0)
        assert_that(reservation.tax_percentage_value).is_equal_to(tax_percentage.value)
        assert_that(reservation.price_net).is_close_to(reservation.price / (1 + tax_percentage.decimal), 6)
        assert_that(reservation.non_subsidised_price_net).is_equal_to(reservation.price_net)

    def test_reservation_non_subsidised_price_is_equal_to_price(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()
        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            lowest_price_net=Decimal("1") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("3") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("createReservation").get("reservation").get("pk")).is_not_none()
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.price).is_equal_to(Decimal("3"))
        assert_that(reservation.non_subsidised_price).is_close_to(reservation.price, 6)
        assert_that(reservation.price_net).is_close_to(Decimal("3") / (1 + tax_percentage.decimal), 6)
        assert_that(reservation.non_subsidised_price_net).is_equal_to(reservation.price_net)

    def test_reservation_duration_is_multiple_of_interval(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        tax_percentage = TaxPercentageFactory()
        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            lowest_price_net=Decimal("1") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("3") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()

        today = datetime.date.today()
        begin = datetime.datetime(today.year, today.month, today.day, 12, 0, tzinfo=get_default_timezone())
        end = begin + datetime.timedelta(minutes=15)  # Is multiple. Should be OK.

        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()

        begin = datetime.datetime(today.year, today.month, today.day, 13, 0, tzinfo=get_default_timezone())
        end = begin + datetime.timedelta(minutes=16)  # Is not multiple. Should fail.

        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation duration is not a multiple of the allowed interval of 15 minutes."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL.value
        )
