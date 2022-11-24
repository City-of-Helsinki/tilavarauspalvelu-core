import datetime
import json
from unittest.mock import patch

import freezegun
from assertpy import assert_that

from api.graphql.tests.test_reservations.base import (
    DEFAULT_TIMEZONE,
    ReservationTestCaseBase,
)
from applications.models import City
from permissions.models import (
    GeneralRoleChoice,
    GeneralRolePermission,
    ServiceSectorRoleChoice,
    ServiceSectorRolePermission,
    UnitRoleChoice,
    UnitRolePermission,
)
from reservations.models import STATE_CHOICES as ReservationState
from reservations.models import AgeGroup, Reservation, ReservationType
from reservations.tests.factories import ReservationFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationCreateStaffTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.res_begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        cls.res_end = cls.res_begin + datetime.timedelta(hours=1)
        GeneralRolePermission.objects.create(
            role=GeneralRoleChoice.objects.get(code="admin"),
            permission="can_create_staff_reservations",
        )

    def get_create_query(self):
        return """
            mutation createStaffReservation($input: ReservationStaffCreateMutationInput!) {
                createStaffReservation(input: $input) {
                    reservation {
                        pk
                    }
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_minimum_input_data(self):
        return {
            "type": ReservationType.STAFF,
            "begin": self.res_begin.strftime("%Y%m%dT%H%M%S%z"),
            "end": self.res_end.strftime("%Y%m%dT%H%M%S%z"),
            "reservationUnitPks": [self.reservation_unit.pk],
        }

    def get_valid_optional_full_input_data(self):
        return {
            "type": ReservationType.BLOCKED,
            "begin": self.res_begin.strftime("%Y%m%dT%H%M%S%z"),
            "end": self.res_end.strftime("%Y%m%dT%H%M%S%z"),
            "reservationUnitPks": [self.reservation_unit.pk],
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
            "bufferTimeBefore": "00:30:00",
            "bufferTimeAfter": "00:30:00",
        }

    def test_general_admin_can_create(self):
        self.client.force_login(self.general_admin)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_minimum_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        )
        reservation = Reservation.objects.get(id=pk)

        assert_that(reservation.type).is_equal_to(ReservationType.STAFF)
        assert_that(reservation.begin).is_equal_to(self.res_begin)
        assert_that(reservation.end).is_equal_to(self.res_end)
        assert_that(reservation.reservation_unit.first()).is_equal_to(
            self.reservation_unit
        )
        assert_that(reservation.buffer_time_after).is_none()
        assert_that(reservation.buffer_time_before).is_none()

    def test_service_sector_admin_can_create(self):
        self.client.force_login(self.create_service_sector_admin(self.service_sector))
        ServiceSectorRolePermission.objects.create(
            role=ServiceSectorRoleChoice.objects.get(code="admin"),
            permission="can_create_staff_reservations",
        )

        response = self.query(
            self.get_create_query(), input_data=self.get_valid_minimum_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        )
        reservation = Reservation.objects.get(id=pk)

        assert_that(reservation.type).is_equal_to(ReservationType.STAFF)
        assert_that(reservation.begin).is_equal_to(self.res_begin)
        assert_that(reservation.end).is_equal_to(self.res_end)
        assert_that(reservation.reservation_unit.first()).is_equal_to(
            self.reservation_unit
        )
        assert_that(reservation.buffer_time_after).is_none()
        assert_that(reservation.buffer_time_before).is_none()

    def test_unit_admin_can_create(self):
        self.client.force_login(self.create_unit_admin(self.unit))
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_create_staff_reservations",
        )

        response = self.query(
            self.get_create_query(), input_data=self.get_valid_minimum_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        )
        reservation = Reservation.objects.get(id=pk)

        assert_that(reservation.type).is_equal_to(ReservationType.STAFF)
        assert_that(reservation.begin).is_equal_to(self.res_begin)
        assert_that(reservation.end).is_equal_to(self.res_end)
        assert_that(reservation.reservation_unit.first()).is_equal_to(
            self.reservation_unit
        )
        assert_that(reservation.buffer_time_after).is_none()
        assert_that(reservation.buffer_time_before).is_none()

    def test_regular_user_cannot_create(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_minimum_input_data()

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains_ignoring_case(
            "No permission to mutate"
        )

        assert_that(Reservation.objects.exists()).is_false()

    def test_create_fails_missing_type(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        input_data.pop("type")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains_ignoring_case(
            "Field 'type' of required type 'String!' was not provided"
        )

        assert_that(Reservation.objects.exists()).is_false()

    def test_create_fails_missing_begin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        input_data.pop("begin")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains_ignoring_case(
            "Field 'begin' of required type 'DateTime!' was not provided"
        )
        assert_that(Reservation.objects.exists()).is_false()

    def test_create_fails_missing_end(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        input_data.pop("end")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).contains_ignoring_case(
            "Field 'end' of required type 'DateTime!' was not provided"
        )
        assert_that(Reservation.objects.exists()).is_false()

    def test_create_fails_end_before_begin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        begin = input_data["end"]
        end = input_data["begin"]
        input_data["begin"] = begin
        input_data["end"] = end

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_BEGIN_AFTER_END"
        )
        assert_that(Reservation.objects.exists()).is_false()

    def test_optional_fields(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_optional_full_input_data()
        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        )
        reservation = Reservation.objects.get(id=pk)

        assert_that(reservation.type).is_equal_to(ReservationType.BLOCKED)
        assert_that(reservation.begin).is_equal_to(self.res_begin)
        assert_that(reservation.end).is_equal_to(self.res_end)
        assert_that(reservation.reservation_unit.first()).is_equal_to(
            self.reservation_unit
        )
        assert_that(reservation.user).is_equal_to(self.general_admin)
        assert_that(reservation.state).is_equal_to(ReservationState.CONFIRMED)
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
            datetime.timedelta(minutes=30)
        )
        assert_that(reservation.buffer_time_before).is_equal_to(
            datetime.timedelta(minutes=30)
        )

    def test_reservation_overlapping_fails(self):
        self.client.force_login(self.general_admin)
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=self.res_begin,
            end=self.res_end,
            state=ReservationState.CONFIRMED,
        )

        response = self.query(
            self.get_create_query(), input_data=self.get_valid_minimum_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "OVERLAPPING_RESERVATIONS"
        )
        assert_that(Reservation.objects.count()).is_equal_to(1)

    def test_buffer_times_cause_overlap_fails(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=self.res_begin - datetime.timedelta(hours=2),
            end=self.res_begin - datetime.timedelta(hours=1),
            buffer_time_after=datetime.timedelta(hours=1, minutes=30),
            state=ReservationState.CONFIRMED,
        )

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_OVERLAP"
        )
        assert_that(Reservation.objects.count()).is_equal_to(1)

    @patch("opening_hours.utils.opening_hours_client.get_opening_hours")
    def test_can_reserve_outside_opening_hours(self, mock_opening_hours):
        mock_opening_hours.return_value = self.get_mocked_opening_hours(
            start_hour=1, end_hour=2
        )

        self.client.force_login(self.general_admin)
        response = self.query(
            self.get_create_query(), input_data=self.get_valid_minimum_input_data()
        )
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_none()
        assert_that(
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        ).is_not_none()
        pk = (
            content.get("data")
            .get("createStaffReservation")
            .get("reservation")
            .get("pk")
        )
        reservation = Reservation.objects.get(id=pk)

        assert_that(reservation.begin).is_equal_to(self.res_begin)
        assert_that(reservation.end).is_equal_to(self.res_end)
        assert_that(reservation.reservation_unit.first()).is_equal_to(
            self.reservation_unit
        )
        assert_that(reservation.buffer_time_after).is_none()
        assert_that(reservation.buffer_time_before).is_none()

    def test_interval_not_respected_fails(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_minimum_input_data()
        input_data["begin"] = (
            self.res_begin + datetime.timedelta(minutes=10)
        ).strftime("%Y%m%dT%H%M%S%z")

        response = self.query(self.get_create_query(), input_data=input_data)
        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL"
        )
        assert_that(Reservation.objects.exists()).is_false()
