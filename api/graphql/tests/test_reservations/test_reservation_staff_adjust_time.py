import datetime
import json
from decimal import Decimal

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from email_notification.models import EmailType
from email_notification.tests.factories import EmailTemplateFactory
from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from reservation_units.models import ReservationUnit
from reservations.models import STATE_CHOICES, ReservationType
from reservations.tests.factories import ReservationFactory

DEFAULT_TIMEZONE = get_default_timezone()


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@override_settings(CELERY_TASK_ALWAYS_EAGER=True)
class ReservationStaffAdjustTimeTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.reservation_begin = datetime.datetime.now(tz=DEFAULT_TIMEZONE)
        cls.reservation_end = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1)
        cls.reservation = ReservationFactory(
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

        EmailTemplateFactory(type=EmailType.RESERVATION_MODIFIED, content="", subject="modified")

        EmailTemplateFactory(
            type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
            content="",
            subject="staff",
        )

    def get_update_query(self):
        return """
            mutation staffAdjustReservationTime($input: ReservationStaffAdjustTimeMutationInput!) {
                staffAdjustReservationTime(input: $input) {
                    begin
                    end
                    state
                    bufferTimeBefore
                    bufferTimeAfter
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
            "begin": (self.reservation_begin + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%S%zZ"),
            "end": (self.reservation_end + datetime.timedelta(hours=1)).strftime("%Y%m%dT%H%M%S%zZ"),
        }

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_time_change_success(self):
        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payload = content.get("data").get("staffAdjustReservationTime")
        assert_that(payload.get("errors")).is_none()

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin + datetime.timedelta(hours=1))
        assert_that(self.reservation.end).is_equal_to((self.reservation_end + datetime.timedelta(hours=1)))
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("modified")

    def test_buffer_change_success(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_adjust_data()
        input_data["bufferTimeBefore"] = "00:15:00"
        input_data["bufferTimeAfter"] = "00:30:00"
        response = self.query(self.get_update_query(), input_data=input_data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payload = content.get("data").get("staffAdjustReservationTime")
        assert_that(payload.get("errors")).is_none()

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.buffer_time_before).is_equal_to(datetime.timedelta(minutes=15))
        assert_that(self.reservation.buffer_time_after).is_equal_to(datetime.timedelta(minutes=30))

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_unit_handler_can_adjust_user_reservation(self):
        unit_admin = self.create_unit_admin(self.unit)
        self.client.force_login(unit_admin)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payload = content.get("data").get("staffAdjustReservationTime")
        assert_that(payload.get("errors")).is_none()

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin + datetime.timedelta(hours=1))
        assert_that(self.reservation.end).is_equal_to((self.reservation_end + datetime.timedelta(hours=1)))
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("modified")

    def test_time_change_to_staff_type_reservation_does_not_send_email(self):
        self.client.force_login(self.general_admin)
        self.reservation.type = ReservationType.STAFF
        self.reservation.save()

        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payload = content.get("data").get("staffAdjustReservationTime")
        assert_that(payload.get("errors")).is_none()

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin + datetime.timedelta(hours=1))
        assert_that(self.reservation.end).is_equal_to((self.reservation_end + datetime.timedelta(hours=1)))
        assert_that(len(mail.outbox)).is_zero()

    def test_wrong_state_fails(self):
        self.reservation.state = STATE_CHOICES.CANCELLED
        self.reservation.save()
        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CANCELLED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_end_before_begin_fails(self):
        self.client.force_login(self.general_admin)

        data = self.get_valid_adjust_data()
        data["end"] = self.reservation_begin.strftime("%Y%m%dT%H%M%S%zZ")

        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_new_reservation_begin_in_past_day_fails(self):
        data = self.get_valid_adjust_data()
        data["begin"] = (self.reservation_begin - datetime.timedelta(days=1)).strftime("%Y%m%dT%H%M%S%zZ")
        data["end"] = (self.reservation_end - datetime.timedelta(days=1)).strftime("%Y%m%dT%H%M%S%zZ")

        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_BEGIN_IN_PAST")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    @freezegun.freeze_time(datetime.datetime(2021, 10, 13, 0).astimezone(DEFAULT_TIMEZONE))
    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_new_reservation_begin_in_past_success_when_current_time_is_first_hour_of_the_day(
        self,
    ):
        data = self.get_valid_adjust_data()
        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payload = content.get("data").get("staffAdjustReservationTime")
        assert_that(payload.get("errors")).is_none()

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin + datetime.timedelta(hours=1))
        assert_that(self.reservation.end).is_equal_to((self.reservation_end + datetime.timedelta(hours=1)))
        assert_that(len(mail.outbox)).is_zero()  # End is passed should not send email.

    @freezegun.freeze_time("2021-10-13T12:00:00Z")
    def test_new_reservation_date_passed_time_change_fails(self):
        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_MODIFICATION_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_new_time_overlaps_another_fails(
        self,
    ):
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=self.reservation_begin + datetime.timedelta(hours=1),
            end=self.reservation_end + datetime.timedelta(hours=1),
            state=STATE_CHOICES.CONFIRMED,
        )

        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("OVERLAPPING_RESERVATIONS")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_overlaps_with_buffer_time_fails(self):
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=self.reservation_begin + datetime.timedelta(hours=2),
            end=self.reservation_end + datetime.timedelta(hours=2),
            state=STATE_CHOICES.CONFIRMED,
            buffer_time_after=datetime.timedelta(minutes=62),
        )

        data = self.get_valid_adjust_data()
        data["begin"] = (self.reservation_begin + datetime.timedelta(hours=3)).strftime("%Y%m%dT%H%M%S%zZ")
        data["end"] = (self.reservation_end + datetime.timedelta(hours=3)).strftime("%Y%m%dT%H%M%S%zZ")

        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_OVERLAP")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    @override_settings(UPDATE_PRODUCT_MAPPING=False)
    def test_overlaps_with_modified_buffer_time_before_fails(self):
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=self.reservation_begin - datetime.timedelta(hours=3),
            end=self.reservation_end - datetime.timedelta(hours=2),
            state=STATE_CHOICES.CONFIRMED,
        )

        data = self.get_valid_adjust_data()
        data["begin"] = (self.reservation_begin).strftime("%Y%m%dT%H%M%S%zZ")
        data["end"] = (self.reservation_end).strftime("%Y%m%dT%H%M%S%zZ")
        data["bufferTimeBefore"] = "01:01:00"

        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_OVERLAP")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    @override_settings(UPDATE_PRODUCT_MAPPING=False)
    def test_overlaps_with_modified_buffer_time_after_fails(self):
        ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=self.reservation_begin + datetime.timedelta(hours=2),
            end=self.reservation_end + datetime.timedelta(hours=3),
            state=STATE_CHOICES.CONFIRMED,
        )

        data = self.get_valid_adjust_data()
        data["begin"] = (self.reservation_begin).strftime("%Y%m%dT%H%M%S%zZ")
        data["end"] = (self.reservation_end).strftime("%Y%m%dT%H%M%S%zZ")
        data["bufferTimeAfter"] = "01:01:00"

        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_OVERLAP")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_reservation_start_time_not_within_the_interval_fails(self):
        self.reservation_unit.reservation_start_interval = ReservationUnit.RESERVATION_START_INTERVAL_15_MINUTES
        self.reservation_unit.save()

        data = self.get_valid_adjust_data()
        data["begin"] = (datetime.datetime.now() + datetime.timedelta(hours=1, minutes=10)).strftime("%Y%m%dT%H%M%S%zZ")

        self.client.force_login(self.general_admin)
        response = self.query(self.get_update_query(), input_data=data)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("extensions").get("error_code")
        assert_that(error).is_equal_to("RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)

    def test_time_change_not_allowed_for_another_user_reservation_if_reserver_role(
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
        response = self.query(self.get_update_query(), input_data=self.get_valid_adjust_data())
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        error = content.get("errors")[0].get("message")
        assert_that(error).contains_ignoring_case("No permission to mutate")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.begin).is_equal_to(self.reservation_begin)
        assert_that(self.reservation.end).is_equal_to(self.reservation_end)
