import datetime
import json
from decimal import Decimal
from unittest.mock import patch

import freezegun
import pytz
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from applications.models import CUSTOMER_TYPES, City
from applications.tests.factories import ApplicationRoundFactory
from opening_hours.hours import DEFAULT_TIMEZONE
from opening_hours.tests.test_get_periods import get_mocked_periods
from reservation_units.models import (
    PriceUnit,
    PricingStatus,
    PricingType,
    ReservationUnit,
)
from reservation_units.tests.factories import (
    ReservationUnitFactory,
    ReservationUnitPricingFactory,
    TaxPercentageFactory,
)
from reservations.models import (
    STATE_CHOICES,
    AgeGroup,
    Reservation,
    ReservationMetadataField,
)
from reservations.tests.factories import ReservationFactory


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
            price_net=Decimal(10) / (Decimal("1.24")),
        )

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
                "%Y%m%dT%H%M%S%zZ"
            ),
            "end": (self.reservation_end + datetime.timedelta(hours=1)).strftime(
                "%Y%m%dT%H%M%S%zZ"
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

    def test_updating_reservation_reservee_language_succeed(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        data = self.get_valid_update_data()
        data["reserveeLanguage"] = "fi"

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("reservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.reservee_language).is_equal_to("fi")

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
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=datetime.datetime.now(tz=get_default_timezone())
            + datetime.timedelta(hours=2),
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.regular_joe)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_update_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Overlapping reservations are not allowed."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "OVERLAPPING_RESERVATIONS"
        )

    def test_update_fails_when_buffer_time_overlaps_reservation_before(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now(tz=get_default_timezone()) - datetime.timedelta(
            hours=2
        )
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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation overlaps with reservation before due to buffer time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_OVERLAP"
        )

        assert_that(self.reservation.priority).is_equal_to(100)

    def test_update_fails_when_buffer_time_overlaps_reservation_after(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        begin = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(
            hours=2
        )
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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation overlaps with reservation after due to buffer time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_OVERLAP"
        )

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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation overlaps with reservation before due to buffer time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_OVERLAP"
        )

    def test_update_fails_when_reservation_unit_buffer_time_overlaps_with_existing_reservation_after(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.reservation_unit.buffer_time_after = datetime.timedelta(hours=1, minutes=1)
        self.reservation_unit.save()
        begin = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(
            hours=2
        )
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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation overlaps with reservation after due to buffer time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_OVERLAP"
        )

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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation unit is not open within desired reservation time."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_UNIT_IS_NOT_OPEN"
        )

    def test_update_succeed_when_reservation_unit_closed_on_selected_time_and_opening_hours_are_ignored(
        self, mock_periods, mock_opening_hours
    ):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

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
        ).is_none()
        reservation_id = (
            content.get("data").get("updateReservation").get("reservation").get("pk")
        )
        assert_that(reservation_id).is_greater_than_or_equal_to(1)
        saved_reservation = Reservation.objects.get(pk=reservation_id)
        assert_that(saved_reservation).is_not_none()
        assert_that(saved_reservation.begin).is_equal_to(pytz.utc.localize(begin))
        assert_that(saved_reservation.end).is_equal_to(pytz.utc.localize(end))

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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "One or more reservation units are in open application round."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_UNIT_IN_OPEN_ROUND"
        )

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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation duration exceeds one or more reservation unit's maximum duration."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_UNITS_MAX_DURATION_EXCEEDED"
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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation duration less than one or more reservation unit's minimum duration."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_UNIT_MIN_DURATION_NOT_EXCEEDED"
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
        input_data["state"] = STATE_CHOICES.CANCELLED.upper()
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

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            f"Setting the reservation state to {STATE_CHOICES.CONFIRMED} is not allowed."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "STATE_CHANGE_NOT_ALLOWED"
        )

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

    def test_update_succeeds_when_missing_reservee_id_but_is_unregistered_org(
        self, mock_periods, mock_opening_hours
    ):
        metadata_set = self._create_metadata_set()
        reservee_id_field = ReservationMetadataField.objects.get(
            field_name="reservee_id"
        )
        metadata_set.required_fields.add(reservee_id_field)
        metadata_set.supported_fields.add(reservee_id_field)
        self.reservation_unit.metadata_set = metadata_set
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
        input_data["reserveeIsUnregisteredAssociation"] = True

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

    def test_update_succeeds_when_missing_home_city_for_individual(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        metadata_set = self._create_metadata_set()
        self.reservation_unit.metadata_set = metadata_set
        self.reservation_unit.save(update_fields=["metadata_set"])

        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["ageGroupPk"] = age_group.pk
        input_data["reserveeType"] = CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL

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
        assert_that(self.reservation.age_group).is_equal_to(age_group)

    def test_update_succeeds_when_missing_reservee_id_for_individual(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        metadata_set = self._create_metadata_set()
        reservee_id_field = ReservationMetadataField.objects.get(
            field_name="reservee_id"
        )
        metadata_set.required_fields.add(reservee_id_field)
        metadata_set.supported_fields.add(reservee_id_field)
        self.reservation_unit.metadata_set = metadata_set
        self.reservation_unit.save(update_fields=["metadata_set"])

        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["ageGroupPk"] = age_group.pk
        input_data["reserveeType"] = CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL

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
        assert_that(self.reservation.age_group).is_equal_to(age_group)

    def test_update_succeeds_when_missing_reservee_organisation_name_for_individual(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()

        metadata_set = self._create_metadata_set()
        reservee_organisation_name_field = ReservationMetadataField.objects.get(
            field_name="reservee_organisation_name"
        )
        metadata_set.required_fields.add(reservee_organisation_name_field)
        metadata_set.supported_fields.add(reservee_organisation_name_field)
        self.reservation_unit.metadata_set = metadata_set
        self.reservation_unit.save(update_fields=["metadata_set"])

        age_group = AgeGroup.objects.create(minimum=18, maximum=30)
        input_data = self.get_valid_update_data()
        input_data["reserveeFirstName"] = "John"
        input_data["reserveeLastName"] = "Doe"
        input_data["reserveePhone"] = "+358123456789"
        input_data["ageGroupPk"] = age_group.pk
        input_data["reserveeType"] = CUSTOMER_TYPES.CUSTOMER_TYPE_INDIVIDUAL

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
        input_data["reserveeFirstName"] = None
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

    def test_update_reservation_succeeds_when_max_reservations_per_user_reached(
        self, mock_periods, mock_opening_hours
    ):
        self.reservation_unit.max_reservations_per_user = 1
        self.reservation_unit.save(update_fields=["max_reservations_per_user"])
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        update_data = self.get_valid_update_data()
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation).is_not_none()
        assert_that(self.reservation.priority).is_equal_to(update_data["priority"])

    def test_updating_reservation_with_staff_event_succeed(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_update_data()
        input_data["staffEvent"] = True
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("reservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.staff_event).is_equal_to(True)

    def test_updating_fails_when_staff_event_is_provided_without_permissions(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data["staffEvent"] = True
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "You don't have permissions to set staff_event"
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "NO_PERMISSION"
        )

    def test_updating_reservation_with_type_succeed(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_update_data()
        input_data["type"] = "blocked"
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("reservation").get("pk")
        ).is_not_none()
        pk = content.get("data").get("updateReservation").get("reservation").get("pk")
        reservation = Reservation.objects.get(id=pk)
        assert_that(reservation).is_not_none()
        assert_that(reservation.type).is_equal_to("blocked")

    def test_updating_fails_when_type_is_provided_without_permissions(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_update_data()
        input_data["type"] = "blocked"
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("updateReservation")
            .get("errors")[0]
            .get("messages")[0]
        ).is_equal_to("You don't have permissions to set type")

    def test_update_reservation_price_calculation_not_triggered(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        update_data = self.get_valid_update_data()
        update_data["begin"] = self.reservation.begin.strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = self.reservation.end.strftime("%Y%m%dT%H%M%S%zZ")
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation).is_not_none()
        assert_that(self.reservation.priority).is_equal_to(update_data["priority"])
        assert_that(self.reservation.price).is_equal_to(10)
        assert_that(self.reservation.unit_price).is_equal_to(10)
        assert_that(self.reservation.tax_percentage_value).is_equal_to(24)
        assert_that(self.reservation.price_net).is_close_to(
            self.reservation.price
            / (1 + self.reservation.tax_percentage_value / Decimal("100")),
            6,
        )

    def test_update_reservation_price_calculation_when_begin_changes(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            highest_price_net=Decimal(3) / (1 + tax_percentage.decimal),
            lowest_price_net=Decimal(1) / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        update_data = self.get_valid_update_data()
        update_data["begin"] = (
            self.reservation.begin + datetime.timedelta(hours=-1)
        ).strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = self.reservation.end.strftime("%Y%m%dT%H%M%S%zZ")
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation).is_not_none()
        assert_that(self.reservation.priority).is_equal_to(update_data["priority"])
        assert_that(self.reservation.price).is_equal_to(3.0)
        assert_that(self.reservation.unit_price).is_equal_to(3.0)
        assert_that(self.reservation.tax_percentage_value).is_equal_to(
            tax_percentage.value
        )
        assert_that(self.reservation.price_net).is_close_to(
            self.reservation.price / (1 + tax_percentage.decimal), 6
        )
        assert_that(self.reservation.non_subsidised_price).is_close_to(
            self.reservation.price, 6
        )
        assert_that(self.reservation.non_subsidised_price_net).is_equal_to(
            self.reservation.price_net
        )

    def test_update_reservation_price_calculation_when_end_changes(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        tax_percentage = TaxPercentageFactory()

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=1.0,
            highest_price=3.0,
            highest_price_net=Decimal(3) / (1 + tax_percentage.decimal),
            lowest_price_net=Decimal(1) / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        update_data = self.get_valid_update_data()
        update_data["begin"] = self.reservation.begin.strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = (
            self.reservation.end + datetime.timedelta(hours=1)
        ).strftime("%Y%m%dT%H%M%S%zZ")
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation).is_not_none()
        assert_that(self.reservation.priority).is_equal_to(update_data["priority"])
        assert_that(self.reservation.price).is_equal_to(3.0)
        assert_that(self.reservation.unit_price).is_equal_to(3.0)
        assert_that(self.reservation.tax_percentage_value).is_equal_to(
            tax_percentage.value
        )
        assert_that(self.reservation.price_net).is_close_to(
            self.reservation.price / (1 + tax_percentage.decimal), 6
        )
        assert_that(self.reservation.non_subsidised_price).is_close_to(
            self.reservation.price, 6
        )
        assert_that(self.reservation.non_subsidised_price_net).is_equal_to(
            self.reservation.price_net
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
    def test_update_reservation_price_calculation_when_unit_changes(
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

        self.client.force_login(self.regular_joe)

        tax_percentage = TaxPercentageFactory()

        new_unit = ReservationUnitFactory(
            spaces=[self.space],
            unit=self.unit,
            name="new_unit",
            reservation_start_interval=ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES,
            reservation_unit_type=self.reservation_unit_type,
            sku=self.reservation_unit.sku,
        )

        ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=2.0,
            highest_price=4.0,
            highest_price_net=Decimal(4) / (1 + tax_percentage.decimal),
            lowest_price_net=Decimal(2) / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=new_unit,
        )

        update_data = self.get_valid_update_data()
        update_data["begin"] = self.reservation.begin.strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = self.reservation.end.strftime("%Y%m%dT%H%M%S%zZ")
        update_data["reservationUnitPks"] = [new_unit.pk]

        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation).is_not_none()
        assert_that(self.reservation.priority).is_equal_to(update_data["priority"])
        assert_that(self.reservation.price).is_equal_to(4.0)
        assert_that(self.reservation.unit_price).is_equal_to(4.0)
        assert_that(self.reservation.tax_percentage_value).is_equal_to(
            tax_percentage.value
        )
        assert_that(self.reservation.price_net).is_close_to(
            self.reservation.price / (1 + tax_percentage.decimal), 6
        )
        assert_that(self.reservation.non_subsidised_price).is_close_to(
            self.reservation.price, 6
        )
        assert_that(self.reservation.non_subsidised_price_net).is_equal_to(
            self.reservation.price_net
        )

    def test_update_reservation_price_calculation_when_begin_changes_to_future(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

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
            lowest_price=4.0,
            highest_price=6.0,
            highest_price_net=Decimal(6) / (1 + tax_percentage.decimal),
            lowest_price_net=Decimal(4) / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_FUTURE,
            reservation_unit=self.reservation_unit,
        )

        update_data = self.get_valid_update_data()
        update_data["begin"] = (
            self.reservation.begin + datetime.timedelta(days=2)
        ).strftime("%Y%m%dT%H%M%S%zZ")
        update_data["end"] = (
            self.reservation.end + datetime.timedelta(days=2)
        ).strftime("%Y%m%dT%H%M%S%zZ")
        response = self.query(self.get_update_query(), input_data=update_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data").get("updateReservation").get("errors")
        ).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation).is_not_none()
        assert_that(self.reservation.priority).is_equal_to(update_data["priority"])
        assert_that(self.reservation.price).is_equal_to(6.0)
        assert_that(self.reservation.unit_price).is_equal_to(6.0)
        assert_that(self.reservation.tax_percentage_value).is_equal_to(
            tax_percentage.value
        )
        assert_that(self.reservation.price_net).is_close_to(
            self.reservation.price / (1 + tax_percentage.decimal), 6
        )
        assert_that(self.reservation.non_subsidised_price).is_close_to(
            self.reservation.price, 6
        )
        assert_that(self.reservation.non_subsidised_price_net).is_equal_to(
            self.reservation.price_net
        )

    def test_require_free_of_charge_reason_if_applying_for_free_of_charge(
        self, mock_periods, mock_opening_hours
    ):
        mock_opening_hours.return_value = self.get_mocked_opening_hours()
        self.client.force_login(self.regular_joe)

        data = self.get_valid_update_data()
        data["applyingForFreeOfCharge"] = True

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Free of charge reason is mandatory when applying for free of charge."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "REQUIRES_REASON_FOR_APPLYING_FREE_OF_CHARGE"
        )
