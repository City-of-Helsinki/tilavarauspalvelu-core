import datetime
import json
from unittest.mock import patch

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from applications.models import City
from applications.tests.factories import ApplicationRoundFactory
from opening_hours.tests.test_get_periods import get_mocked_periods
from reservations.models import STATE_CHOICES, AgeGroup, Reservation
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
        ).contains("Reservation overlaps with reservation before due to buffer time.")
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
        ).contains("Reservation overlaps with reservation after due to buffer time.")

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
        ).contains("Reservation overlaps with reservation before due to buffer time.")

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
        ).contains("Reservation overlaps with reservation after due to buffer time.")

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
