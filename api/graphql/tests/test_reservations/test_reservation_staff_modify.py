import datetime
import json
from decimal import Decimal

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from reservations.models import STATE_CHOICES, ReservationType
from reservations.tests.factories import ReservationFactory

DEFAULT_TIMEZONE = get_default_timezone()


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationStaffModifyTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.reservation_begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        cls.reservation_end = datetime.datetime.now(
            tz=DEFAULT_TIMEZONE
        ) + datetime.timedelta(hours=1)
        cls.reservation = ReservationFactory(
            name="Original name",
            description="Original description",
            reservation_unit=[cls.reservation_unit],
            reservee_email=cls.regular_joe.email,
            begin=cls.reservation_begin,
            end=cls.reservation_end,
            state=STATE_CHOICES.CONFIRMED,
            user=cls.regular_joe,
            priority=100,
            unit_price=0,
            tax_percentage_value=24,
            price=0,
            price_net=Decimal(0) / (Decimal("1.24")),
            type=ReservationType.NORMAL,
        )

    def get_update_query(self):
        return """
            mutation staffReservationModify($input: ReservationStaffModifyMutationInput!) {
                staffReservationModify(input: $input) {
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_adjust_data(self):
        return {
            "pk": self.reservation.pk,
            "name": "New name",
            "description": "New description",
            "reserveeEmail": "reservee@localhost",
        }

    def test_modify_success(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_adjust_data()

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payload = content.get("data").get("staffReservationModify")
        assert_that(payload.get("errors")).is_none()

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.name).is_equal_to(data.get("name"))
        assert_that(self.reservation.description).is_equal_to(data.get("description"))
        assert_that(self.reservation.reservee_email).is_equal_to(
            data.get("reserveeEmail")
        )

    def test_unit_handler_can_modify_user_reservation(self):
        unit_admin = self.create_unit_admin(self.unit)
        self.client.force_login(unit_admin)

        data = self.get_valid_adjust_data()

        response = self.query(
            self.get_update_query(), input_data=self.get_valid_adjust_data()
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payload = content.get("data").get("staffReservationModify")
        assert_that(payload.get("errors")).is_none()

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.name).is_equal_to(data.get("name"))
        assert_that(self.reservation.description).is_equal_to(data.get("description"))
        assert_that(self.reservation.reservee_email).is_equal_to(
            data.get("reserveeEmail")
        )

    def test_cant_change_type_normal_reservation_to_staff(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_adjust_data()
        data["type"] = ReservationType.STAFF

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        error = content.get("errors")[0].get("extensions").get("error_code")
        message = content.get("errors")[0].get("message")

        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")
        assert_that(message).is_equal_to(
            "Reservation type cannot be changed from NORMAL to STAFF."
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.type).is_equal_to(ReservationType.NORMAL)

    def test_cant_change_type_normal_reservation_to_behalf(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_adjust_data()
        data["type"] = ReservationType.BEHALF

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        error = content.get("errors")[0].get("extensions").get("error_code")
        message = content.get("errors")[0].get("message")

        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")
        assert_that(message).is_equal_to(
            "Reservation type cannot be changed from NORMAL to BEHALF."
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.type).is_equal_to(ReservationType.NORMAL)

    def test_cant_change_type_normal_reservation_to_blocked(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_adjust_data()
        data["type"] = ReservationType.BLOCKED

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        error = content.get("errors")[0].get("extensions").get("error_code")
        message = content.get("errors")[0].get("message")

        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")
        assert_that(message).is_equal_to(
            "Reservation type cannot be changed from NORMAL to BLOCKED."
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.type).is_equal_to(ReservationType.NORMAL)

    def test_cant_change_type_staff_reservation_to_normal(self):
        self.client.force_login(self.general_admin)

        self.reservation.type = ReservationType.STAFF
        self.reservation.save()

        data = self.get_valid_adjust_data()
        data["type"] = ReservationType.NORMAL

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        error = content.get("errors")[0].get("extensions").get("error_code")
        message = content.get("errors")[0].get("message")

        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")
        assert_that(message).is_equal_to(
            "Reservation type cannot be changed to NORMAl from state STAFF."
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.type).is_equal_to(ReservationType.STAFF)

    def test_cant_change_type_behalf_reservation_to_normal(self):
        self.client.force_login(self.general_admin)

        self.reservation.type = ReservationType.BEHALF
        self.reservation.save()

        data = self.get_valid_adjust_data()
        data["type"] = ReservationType.NORMAL

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        error = content.get("errors")[0].get("extensions").get("error_code")
        message = content.get("errors")[0].get("message")

        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")
        assert_that(message).is_equal_to(
            "Reservation type cannot be changed to NORMAl from state BEHALF."
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.type).is_equal_to(ReservationType.BEHALF)

    def test_cant_change_type_blocked_reservation_to_normal(self):
        self.client.force_login(self.general_admin)

        self.reservation.type = ReservationType.BLOCKED
        self.reservation.save()

        data = self.get_valid_adjust_data()
        data["type"] = ReservationType.NORMAL

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        error = content.get("errors")[0].get("extensions").get("error_code")
        message = content.get("errors")[0].get("message")

        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")
        assert_that(message).is_equal_to(
            "Reservation type cannot be changed to NORMAl from state BLOCKED."
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.type).is_equal_to(ReservationType.BLOCKED)

    def test_wrong_state_fails(self):
        self.reservation.state = STATE_CHOICES.CANCELLED
        self.reservation.save()
        self.client.force_login(self.general_admin)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_adjust_data()
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CANCELLED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_modify_not_allowed_for_another_user_reservation_if_reserver_role(
        self,
    ):
        reserver_staff_user = get_user_model().objects.create(
            username="res",
            first_name="res",
            last_name="erver",
            email="res.erver@foo.com",
        )
        UnitRoleChoice.objects.create(
            code="staff",
            verbose_name="staff who can create reservations but nothing else",
        )
        unit_role = UnitRole.objects.create(
            user=reserver_staff_user,
            role=UnitRoleChoice.objects.get(code="staff"),
        )
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="staff"),
            permission="can_create_staff_reservations",
        )

        unit_role.unit.add(self.unit)

        self.client.force_login(reserver_staff_user)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_adjust_data()
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("message")
        assert_that(error).contains_ignoring_case("No permission to mutate")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.name).is_equal_to("Original name")
        assert_that(self.reservation.description).is_equal_to("Original description")

    @freezegun.freeze_time("2021-10-13T12:00:00Z")
    def test_new_reservation_date_passed_time_change_fails(self):
        self.client.force_login(self.general_admin)
        response = self.query(
            self.get_update_query(), input_data=self.get_valid_adjust_data()
        )
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")

        message = content.get("errors")[0].get("message")
        assert_that(message).is_equal_to("Reservation cannot be changed anymore.")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.name).is_equal_to("Original name")
        assert_that(self.reservation.description).is_equal_to("Original description")

    @freezegun.freeze_time(
        datetime.datetime(2021, 10, 13, 0).astimezone(DEFAULT_TIMEZONE)
    )
    def test_modify_success_when_in_first_hour_of_next_day(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_adjust_data()

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payload = content.get("data").get("staffReservationModify")
        assert_that(payload.get("errors")).is_none()

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.name).is_equal_to(data["name"])
        assert_that(self.reservation.description).is_equal_to(data["description"])
