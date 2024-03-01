import datetime
import json
from decimal import Decimal
from unittest.mock import MagicMock, patch

import freezegun
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.extensions.validation_errors import ValidationErrorCodes
from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from applications.choices import PriorityChoice
from applications.models import City
from opening_hours.models import ReservableTimeSpan
from reservation_units.enums import (
    PriceUnit,
    PricingStatus,
    PricingType,
    ReservationKind,
    ReservationStartInterval,
)
from reservation_units.models import ReservationUnit
from reservations.choices import ReservationStateChoice, ReservationTypeChoice
from reservations.models import AgeGroup, Reservation
from tests.factories import (
    ApplicationRoundFactory,
    OriginHaukiResourceFactory,
    ReservableTimeSpanFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    TaxPercentageFactory,
)
from utils.decimal_utils import round_decimal

DEFAULT_TIMEZONE = get_default_timezone()


def get_profile_data():
    return {"data": {"myProfile": {"firstName": "John", "lastName": "Doe"}}}


@freezegun.freeze_time(datetime.datetime(2021, 10, 12, 12, 0, tzinfo=DEFAULT_TIMEZONE))
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
            "begin": datetime.datetime.now(tz=DEFAULT_TIMEZONE).isoformat(),
            "end": (datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(hours=1)).isoformat(),
            "reservationUnitPks": [self.reservation_unit.pk],
        }

    def setUp(self):
        super().setUp()
        self.reservation_unit: ReservationUnit = ReservationUnitFactory(
            spaces=[self.space],
            name="resunit",
            reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES.value,
            buffer_time_before=datetime.timedelta(minutes=30),
            buffer_time_after=datetime.timedelta(minutes=30),
            origin_hauki_resource=self.reservation_unit.origin_hauki_resource,
        )

    def test_creating_reservation_succeed(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.user == self.regular_joe
        assert reservation.state == ReservationStateChoice.CREATED
        assert reservation.priority == PriorityChoice.MEDIUM
        assert reservation.reservee_first_name == input_data["reserveeFirstName"]
        assert reservation.reservee_last_name == input_data["reserveeLastName"]
        assert reservation.reservee_phone == input_data["reserveePhone"]
        assert reservation.name == input_data["name"]
        assert reservation.description == input_data["description"]
        assert reservation.purpose == self.purpose
        assert reservation.buffer_time_after == self.reservation_unit.buffer_time_after
        assert reservation.buffer_time_before == self.reservation_unit.buffer_time_before

    @override_settings(PREFILL_RESERVATION_WITH_PROFILE_DATA=True)
    @patch(
        "users.utils.open_city_profile.basic_info_resolver.requests.get",
        return_value=MagicMock(status_code=200, json=MagicMock(return_value=get_profile_data())),
    )
    def test_reservation_succeed_with_minimum_data(self, mock_profile_call):
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

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.user == self.regular_joe
        assert reservation.state == ReservationStateChoice.CREATED
        assert reservation.priority == PriorityChoice.MEDIUM

        assert reservation.buffer_time_after == self.reservation_unit.buffer_time_after
        assert reservation.buffer_time_before == self.reservation_unit.buffer_time_before

    def test_creating_reservation_with_reservation_language_succeed(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["reserveeLanguage"] = "fi"
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.reservee_language == "fi"

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
    ):
        mock_is_open.return_value = True
        mock_get_conflicting_open_application_round.return_value = None
        mock_get_reservation_unit_possible_start_times.return_value = [datetime.datetime.now(tz=DEFAULT_TIMEZONE)]
        sku = "340026__2652000155___44_10000100"
        self.reservation_unit.sku = sku
        self.reservation_unit.save(update_fields=["sku"])
        res_unit_too = ReservationUnitFactory(
            buffer_time_before=datetime.timedelta(minutes=90),
            buffer_time_after=datetime.timedelta(),
            sku=sku,
        )
        res_unit_another = ReservationUnitFactory(
            buffer_time_before=datetime.timedelta(),
            buffer_time_after=datetime.timedelta(minutes=15),
            sku=sku,
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["reservationUnitPks"].extend([res_unit_too.id, res_unit_another.id])
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.buffer_time_after == self.reservation_unit.buffer_time_after
        assert reservation.buffer_time_before == res_unit_too.buffer_time_before

    def test_creating_reservation_without_optional_fields_succeeds(self):
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
        assert content.get("errors") is None
        assert Reservation.objects.exists() is True

    def test_creating_reservation_price_fails(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["price"] = 10
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert Reservation.objects.exists() is False

    def test_creating_reservation_with_pk_fails(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["pk"] = 9999
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert Reservation.objects.exists() is False

    def test_create_fails_when_overlapping_reservation(self):
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=DEFAULT_TIMEZONE),
            end=datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(hours=2),
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Overlapping reservations are not allowed."
        assert content.get("errors")[0]["extensions"]["error_code"] == "OVERLAPPING_RESERVATIONS"

    def test_create_fails_when_buffer_time_overlaps_reservation_before(self):
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

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation overlaps with reservation before due to buffer time."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_OVERLAP"

    def test_create_succeed_when_buffer_time_overlaps_blocked_reservation_before(self):
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

        assert content.get("errors") is None

    def test_create_fails_when_buffer_time_overlaps_reservation_after(self):
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

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation overlaps with reservation after due to buffer time."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_OVERLAP"

    def test_create_succeed_when_buffer_time_overlaps_block_reservation_after(self):
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

        assert content.get("errors") is None

    def test_create_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_before(self):
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

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation overlaps with reservation before due to buffer time."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_OVERLAP"

    def test_create_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_after(self):
        self.reservation_unit.buffer_time_after = datetime.timedelta(hours=1, minutes=1)
        self.reservation_unit.save()

        begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(hours=2)
        end = begin + datetime.timedelta(hours=1)

        ReservationFactory.create_for_reservation_unit(
            reservation_unit=self.reservation_unit,
            begin=begin,
            end=end,
            state=ReservationStateChoice.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation overlaps with reservation after due to buffer time."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_OVERLAP"

    def test_create_fails_when_reservation_unit_closed_on_selected_time(self):
        input_data = self.get_valid_input_data()
        today = datetime.date.today()
        begin = datetime.datetime(today.year, today.month, today.day, 21, 0, tzinfo=get_default_timezone())
        end = begin + datetime.timedelta(hours=2)
        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation unit is not open within desired reservation time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_IS_NOT_OPEN"

    def test_create_succeed_when_reservation_unit_closed_on_selected_time_and_opening_hours_are_ignored(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        input_data = self.get_valid_input_data()
        today = datetime.date.today()
        begin = datetime.datetime(today.year, today.month, today.day, 21, 0, tzinfo=get_default_timezone())
        end = begin + datetime.timedelta(hours=2)
        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        reservation_id = content.get("data").get("createReservation").get("reservation").get("pk")
        assert reservation_id >= 1
        saved_reservation = Reservation.objects.get(pk=reservation_id)
        assert saved_reservation is not None

    def test_create_fails_when_reservation_unit_in_open_application_round_decimal(self):
        ApplicationRoundFactory(
            reservation_units=[self.reservation_unit],
            reservation_period_begin=datetime.date.today(),
            reservation_period_end=datetime.date.today() + datetime.timedelta(days=10),
        )

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "One or more reservation units are in open application round."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_IN_OPEN_ROUND"

    def test_create_fails_when_reservation_unit_max_reservation_duration_exceeds(self):
        self.reservation_unit.max_reservation_duration = datetime.timedelta(minutes=30)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation duration exceeds one or more reservation unit's maximum duration."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNITS_MAX_DURATION_EXCEEDED"

    def test_create_fails_when_reservation_unit_min_reservation_duration_subsides(self):
        self.reservation_unit.max_reservation_duration = None
        self.reservation_unit.min_reservation_duration = datetime.timedelta(hours=2)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation duration less than one or more reservation unit's minimum duration."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED"

    def test_create_succeeds_when_start_time_matches_reservation_start_interval(self):
        self.client.force_login(self.regular_joe)

        interval: ReservationStartInterval
        for interval in ReservationStartInterval:
            interval_minutes = interval.as_number
            input_data = self.get_valid_input_data()
            self.reservation_unit.reservation_start_interval = interval
            self.reservation_unit.save(update_fields=["reservation_start_interval"])

            begin = self.reservation_unit.origin_hauki_resource.reservable_time_spans.first().start_datetime
            begin += datetime.timedelta(minutes=interval_minutes)
            input_data["begin"] = begin.isoformat()
            input_data["end"] = (begin + datetime.timedelta(minutes=interval_minutes)).isoformat()

            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)
            assert content.get("errors") is None
            payload = content.get("data").get("createReservation", {})
            assert payload.get("errors") is None
            Reservation.objects.get(pk=payload["reservation"]["pk"]).delete()

    def test_create_fails_when_start_time_does_not_match_reservation_start_interval(self):
        self.client.force_login(self.regular_joe)

        interval: ReservationStartInterval
        for interval in ReservationStartInterval:
            interval_minutes = interval.as_number
            input_data = self.get_valid_input_data()
            self.reservation_unit.reservation_start_interval = interval
            self.reservation_unit.save(update_fields=["reservation_start_interval"])

            begin = self.reservation_unit.origin_hauki_resource.reservable_time_spans.first().start_datetime
            begin += datetime.timedelta(minutes=interval_minutes + 1)
            end = begin + datetime.timedelta(minutes=interval_minutes)
            input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
            input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)
            assert content.get("errors") is not None
            assert content.get("errors")[0]["message"] == (
                f"Reservation start time does not match the allowed interval of {interval_minutes} minutes."
            )
            assert content.get("errors")[0]["extensions"]["error_code"] == (
                "RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL"
            )

    def test_create_succeed_when_start_time_does_not_match_reservation_start_interval_and_opening_hours_are_ignored(
        self,
    ):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        intervals = list(ReservationStartInterval.values)
        for interval, interval_minutes in zip(intervals, [15, 90]):
            input_data = self.get_valid_input_data()
            self.reservation_unit.reservation_start_interval = interval
            self.reservation_unit.save(update_fields=["reservation_start_interval"])
            begin = datetime.datetime.now() + datetime.timedelta(minutes=interval_minutes + 1)
            input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
            input_data["end"] = (begin + datetime.timedelta(minutes=interval_minutes)).strftime("%Y%m%dT%H%M%SZ")
            response = self.query(self.get_create_query(), input_data=input_data)
            content = json.loads(response.content)
            assert content.get("errors") is None
            payload = content.get("data").get("createReservation", {})
            assert payload.get("errors") is None
            reservation_id = payload.get("reservation").get("pk")
            assert reservation_id >= 1
            saved_reservation = Reservation.objects.get(pk=reservation_id)
            assert saved_reservation is not None

    def test_create_fails_when_reservation_unit_reservation_begins_in_future(self):
        self.reservation_unit.reservation_begins = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(
            days=10
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation unit is not reservable at current time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_NOT_RESERVABLE"

    def test_create_fails_when_reservation_unit_publish_begins_in_future(self):
        self.reservation_unit.publish_begins = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(days=10)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation unit is not reservable at current time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_NOT_RESERVABLE"

    def test_create_fails_when_reservation_unit_reservation_ends_in_past(self):
        self.reservation_unit.reservation_ends = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(
            days=10
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation unit is not reservable at current time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_NOT_RESERVABLE"

    def test_create_fails_reservation_unit_state_is_archived(self):
        self.reservation_unit.is_archived = True
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation unit is not reservable due to status is ReservationUnitState.ARCHIVED."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_NOT_RESERVABLE"

    def test_create_fails_reservation_unit_state_is_draft(self):
        self.reservation_unit.is_draft = True
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation unit is not reservable due to status is ReservationUnitState.DRAFT."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_NOT_RESERVABLE"

    def test_create_fails_when_reservation_unit_publish_ends_in_past(self):
        self.reservation_unit.publish_ends = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(days=10)
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "Reservation unit is not reservable at current time."
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_NOT_RESERVABLE"

    def test_create_success_when_reservation_unit_reservation_begin_in_past(self):
        self.reservation_unit.reservation_begins = datetime.datetime.now(tz=DEFAULT_TIMEZONE) - datetime.timedelta(
            days=10
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        reservation = Reservation.objects.filter(
            id=content.get("data").get("createReservation").get("reservation").get("pk")
        ).first()
        assert reservation is not None

    def test_create_success_when_reservation_unit_reservation_end_in_future(self):
        self.reservation_unit.reservation_ends = datetime.datetime.now(tz=DEFAULT_TIMEZONE) + datetime.timedelta(
            days=10
        )
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        reservation = Reservation.objects.filter(
            id=content.get("data").get("createReservation").get("reservation").get("pk")
        ).first()
        assert reservation is not None

    def test_create_fails_when_not_logged_in(self):
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message") == "No permission to mutate"

    def test_create_success_when_reservation_date_over_next_spring(self):
        """
        In reservation creation it is needed to use opening_hours_end date
        parameter in ReservationUnitReservationScheduler initialization to get
        the possible opening hours from beyond next spring which is what the scheduler
        class defaults to.
        """
        ReservableTimeSpan.objects.update(
            start_datetime=datetime.datetime.combine(
                datetime.date(2022, 6, 15), datetime.time(6), tzinfo=DEFAULT_TIMEZONE
            ),
            end_datetime=datetime.datetime.combine(
                datetime.date(2022, 6, 15), datetime.time(22), tzinfo=DEFAULT_TIMEZONE
            ),
        )

        res_start = datetime.datetime(2022, 6, 15, 15, 0, tzinfo=get_default_timezone())
        valid_data = self.get_valid_input_data()
        valid_data["begin"] = res_start.strftime("%Y%m%dT%H%M%SZ")
        valid_data["end"] = (res_start + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%SZ")
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=valid_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None

    def test_creating_reservation_succeeds_when_under_max_reservations_per_user(self):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        assert Reservation.objects.exists() is True

    def test_creating_reservation_fails_when_max_reservations_per_user_reached(self):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])
        existing_reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now() + datetime.timedelta(hours=24),
            end=datetime.datetime.now() + datetime.timedelta(hours=25),
            state=ReservationStateChoice.CONFIRMED,
            user=self.regular_joe,
        )
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Maximum number of active reservations for this reservation unit exceeded."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == "MAX_NUMBER_OF_ACTIVE_RESERVATIONS_EXCEEDED"
        assert Reservation.objects.exclude(pk=existing_reservation.pk).exists() is False

    def test_old_reservations_are_not_counted_towards_max_reservations_per_user(self):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now() - datetime.timedelta(hours=25),
            end=datetime.datetime.now() - datetime.timedelta(hours=24),
            state=ReservationStateChoice.CONFIRMED,
            user=self.regular_joe,
        )
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        assert Reservation.objects.exists() is True

    def test_reservations_from_other_runits_are_not_counted_towards_max_reservations_per_user(self):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])

        other_reservation_unit = ReservationUnitFactory(
            spaces=[self.space],
            name="other resunit",
            reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES.value,
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
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        assert Reservation.objects.exists() is True

    def test_creating_reservation_copies_sku_from_reservation_unit(self):
        self.reservation_unit.sku = "340026__2652000155___44_10000117"
        self.reservation_unit.save(update_fields=["sku"])
        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        reservation = Reservation.objects.get()
        assert reservation.sku == self.reservation_unit.sku

    def test_creating_reservation_fails_if_sku_is_ambiguous(self):
        resunit1 = ReservationUnitFactory(
            sku="340026__2652000155___44_10000001",
            origin_hauki_resource=OriginHaukiResourceFactory(id=888),
        )
        resunit2 = ReservationUnitFactory(
            sku="340026__2652000155___44_10000002",
            origin_hauki_resource=OriginHaukiResourceFactory(id=777),
        )
        ReservableTimeSpanFactory(
            resource=resunit1.origin_hauki_resource,
            start_datetime=datetime.datetime.combine(datetime.date.today(), datetime.time(6), tzinfo=DEFAULT_TIMEZONE),
            end_datetime=datetime.datetime.combine(datetime.date.today(), datetime.time(22), tzinfo=DEFAULT_TIMEZONE),
        )
        ReservableTimeSpanFactory(
            resource=resunit2.origin_hauki_resource,
            start_datetime=datetime.datetime.combine(datetime.date.today(), datetime.time(6), tzinfo=DEFAULT_TIMEZONE),
            end_datetime=datetime.datetime.combine(datetime.date.today(), datetime.time(22), tzinfo=DEFAULT_TIMEZONE),
        )

        input_data = self.get_valid_input_data()
        input_data["reservationUnitPks"] = [resunit1.pk, resunit2.pk]

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == "An ambiguous SKU cannot be assigned for this reservation."
        assert content.get("errors")[0]["extensions"]["error_code"] == "AMBIGUOUS_SKU"

    def test_create_fails_when_reservation_unit_reservations_max_days_before_exceeds(self):
        res_begin = datetime.datetime.now() + datetime.timedelta(days=181)
        ReservableTimeSpan.objects.update(
            start_datetime=datetime.datetime.combine(res_begin, datetime.time(6), tzinfo=DEFAULT_TIMEZONE),
            end_datetime=datetime.datetime.combine(res_begin, datetime.time(22), tzinfo=DEFAULT_TIMEZONE),
        )

        self.reservation_unit.reservations_max_days_before = 180
        self.reservation_unit.save()

        data = self.get_valid_input_data()
        data["begin"] = res_begin.strftime("%Y%m%dT%H%M%SZ")
        data["end"] = (res_begin + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%SZ")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert "Reservation start time is earlier than" in content.get("errors")[0]["message"]
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE"

    def test_create_succeed_when_reservation_unit_reservations_max_days_before_in_limits(self):
        self.reservation_unit.reservations_max_days_before = 180
        self.reservation_unit.save()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None

    def test_create_fails_when_reservation_unit_reservations_min_days_before_subseeds(self):
        self.reservation_unit.reservations_min_days_before = 1
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert "Reservation start time is less than" in content.get("errors")[0]["message"]
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_NOT_WITHIN_ALLOWED_TIME_RANGE"

    def test_create_succeed_when_reservation_is_done_less_than_one_full_day_before(self):
        reservation_begin = datetime.datetime(2021, 10, 13, 0, 0, 0, tzinfo=get_default_timezone())
        reservation_end = reservation_begin + datetime.timedelta(hours=1)

        ReservableTimeSpan.objects.update(
            start_datetime=datetime.datetime.combine(
                reservation_begin.date(), datetime.time(0), tzinfo=DEFAULT_TIMEZONE
            ),
            end_datetime=datetime.datetime.combine(
                reservation_begin.date(), datetime.time(22), tzinfo=DEFAULT_TIMEZONE
            ),
        )

        self.reservation_unit.reservations_min_days_before = 1
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["begin"] = reservation_begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = reservation_end.strftime("%Y%m%dT%H%M%SZ")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None

        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None

    def test_create_succeed_when_reservation_unit_reservations_in_days_before_in_limits(self):
        self.reservation_unit.reservations_min_days_before = 0
        self.reservation_unit.save()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None

    def test_create_fails_when_reservation_unit_reservation_kind_is_season(self):
        self.reservation_unit.reservation_kind = ReservationKind.SEASON
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_create_query(), input_data=self.get_valid_input_data())
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert "reservation kind is SEASON" in content.get("errors")[0]["message"]
        assert content.get("errors")[0]["extensions"]["error_code"] == "RESERVATION_UNIT_TYPE_IS_SEASON"

    def test_creating_reservation_type_to_staff_succeed(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["type"] = ReservationTypeChoice.STAFF
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.type == ReservationTypeChoice.STAFF

    def test_creating_reservation_with_type_succeed(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_input_data()
        input_data["type"] = "blocked"
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.type == "blocked"

    def test_creating_fails_when_type_is_provided_without_permissions(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        input_data["type"] = "blocked"
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)
        assert content.get("errors") is not None
        assert content.get("errors")[0].get("message") == "You don't have permissions to set type"

    def test_create_price_calculation_with_free_reservation_unit(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.price == 0  # Free units should always be 0 €
        assert reservation.non_subsidised_price == reservation.price  # Non subsidised price should copy of price
        assert reservation.price_net == 0
        assert reservation.non_subsidised_price_net == reservation.price_net
        assert reservation.unit_price == 0
        assert reservation.tax_percentage_value == 0

    def test_create_price_calculation_with_fixed_price_reservation_unit(self):
        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.price == 3.0  # With fixed price unit, time is ignored
        assert reservation.non_subsidised_price == round_decimal(reservation.price, 3)
        assert reservation.unit_price == 3.0
        assert reservation.price_net == round_decimal(Decimal("3") / tax_percentage.multiplier, 6)
        assert reservation.non_subsidised_price_net == reservation.price_net
        assert reservation.tax_percentage_value == tax_percentage.value

    def test_create_price_calculation_with_time_based_price_reservation_unit(self):
        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
            lowest_price=1.0,
            highest_price=3.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.price == 3.0 * 4  # 1h reservation = 4 x 15 min = 4 x 3 €
        assert reservation.non_subsidised_price == round_decimal(reservation.price, 3)
        assert reservation.price_net == round_decimal((Decimal("3") * 4) / tax_percentage.multiplier, 6)
        assert reservation.non_subsidised_price_net == reservation.price_net
        assert reservation.unit_price == 3.0  # 1h reservation = 4 x 15 min = 4 x 3 €
        assert reservation.tax_percentage_value == tax_percentage.value

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
            highest_price=3.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        second_unit = ReservationUnitFactory(
            spaces=[self.space],
            name="second_unit",
            reservation_start_interval=ReservationStartInterval.INTERVAL_15_MINUTES.value,
            buffer_time_before=datetime.timedelta(minutes=30),
            buffer_time_after=datetime.timedelta(minutes=30),
            sku=sku,
        )

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_15_MINS,
            lowest_price=2.0,
            highest_price=4.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=second_unit,
        )

        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_input_data()
        input_data["reservationUnitPks"] = [self.reservation_unit.pk, second_unit.pk]

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.price == 3.0 * 4 + 4.0 * 4  # 1h reservation = 4 x 15 min from both units
        assert reservation.non_subsidised_price == round_decimal(reservation.price, 6)
        assert reservation.unit_price == 3.0  # 3€ from the first unit
        assert reservation.tax_percentage_value == tax_percentage.value
        assert reservation.price_net == round_decimal(reservation.price / tax_percentage.multiplier, 6)
        assert reservation.non_subsidised_price_net == reservation.price_net

    def test_create_price_calculation_with_future_pricing(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
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
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_FUTURE,
            reservation_unit=self.reservation_unit,
        )

        self.client.force_login(self.regular_joe)

        input_data = self.get_valid_input_data()
        input_data["begin"] = (datetime.datetime.now() + datetime.timedelta(days=2)).strftime("%Y%m%dT%H%M%SZ")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.price == 6.0  # With fixed price unit, time is ignored
        assert reservation.non_subsidised_price == round_decimal(reservation.price, 6)
        assert reservation.price_net == round_decimal(6 / tax_percentage.multiplier, 6)
        assert reservation.unit_price == 6.0
        assert reservation.tax_percentage_value == tax_percentage.value
        assert reservation.price_net == round_decimal(reservation.price / tax_percentage.multiplier, 6)
        assert reservation.non_subsidised_price_net == reservation.price_net

    def test_reservation_non_subsidised_price_is_equal_to_price(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()
        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is None
        assert content.get("data").get("createReservation").get("reservation").get("pk") is not None
        pk = content.get("data").get("createReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert reservation is not None
        assert reservation.price == Decimal("3")
        assert reservation.non_subsidised_price == round_decimal(reservation.price, 6)
        assert reservation.price_net == round_decimal(Decimal("3") / tax_percentage.multiplier, 6)
        assert reservation.non_subsidised_price_net == reservation.price_net

    def test_reservation_duration_is_multiple_of_interval(self):
        tax_percentage = TaxPercentageFactory()
        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
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

        assert content.get("errors") is None

        begin = datetime.datetime(today.year, today.month, today.day, 13, 0, tzinfo=get_default_timezone())
        end = begin + datetime.timedelta(minutes=16)  # Is not multiple. Should fail.

        input_data["begin"] = begin.strftime("%Y%m%dT%H%M%SZ")
        input_data["end"] = end.strftime("%Y%m%dT%H%M%SZ")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert content.get("errors") is not None
        assert content.get("errors")[0]["message"] == (
            "Reservation duration is not a multiple of the allowed interval of 15 minutes."
        )
        assert content.get("errors")[0]["extensions"]["error_code"] == (
            ValidationErrorCodes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL.value
        )
