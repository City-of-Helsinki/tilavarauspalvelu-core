import datetime
import json

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from email_notification.models import EmailType
from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from reservations.models import STATE_CHOICES, ReservationType
from tests.factories import (
    EmailTemplateFactory,
    ReservationDenyReasonFactory,
    ReservationFactory,
    ReservationMetadataSetFactory,
)


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationDenyTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        metadata = ReservationMetadataSetFactory()
        self.reservation_unit.metadata_set = metadata
        self.reservation_unit.save()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1),
            end=(datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2)),
            state=STATE_CHOICES.REQUIRES_HANDLING,
            user=self.regular_joe,
            reservee_email="email@reservee",
            type=ReservationType.NORMAL,
        )
        self.reason = ReservationDenyReasonFactory(reason_fi="syy", reason_en="reason", reason_sv="resonera")
        EmailTemplateFactory(type=EmailType.RESERVATION_REJECTED, content="", subject="denied")

    def get_handle_query(self):
        return """
            mutation denyReservation($input: ReservationDenyMutationInput!) {
                denyReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_deny_data(self):
        return {
            "pk": self.reservation.pk,
            "handlingDetails": "no can do",
            "denyReasonPk": self.reason.pk,
        }

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_deny_success_when_admin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("state")).is_equal_to(STATE_CHOICES.DENIED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(self.reservation.handling_details).is_equal_to("no can do")
        assert_that(self.reservation.handled_at).is_not_none()
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("denied")

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_deny_success_when_admin_and_state_is_confirmed(self):
        self.reservation.state = STATE_CHOICES.CONFIRMED
        self.reservation.save()

        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("state")).is_equal_to(STATE_CHOICES.DENIED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(self.reservation.handling_details).is_equal_to("no can do")
        assert_that(self.reservation.handled_at).is_not_none()
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("denied")

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_deny_success_when_own_reservation_with_reservation_staff_create_permissions(
        self,
    ):
        staff_person = get_user_model().objects.create(
            username="unit_admin",
            first_name="Staff",
            last_name="Persson",
            email="staff.persson@foo.com",
        )

        unit_role = UnitRole.objects.create(user=staff_person, role=UnitRoleChoice.objects.get(code="admin"))
        UnitRolePermission.objects.create(
            role=UnitRoleChoice.objects.get(code="admin"),
            permission="can_create_staff_reservations",
        )
        unit_role.unit.add(self.unit)

        self.reservation.user = staff_person
        self.reservation.save()
        self.client.force_login(staff_person)
        input_data = self.get_valid_deny_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("state")).is_equal_to(STATE_CHOICES.DENIED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(self.reservation.handling_details).is_equal_to("no can do")
        assert_that(self.reservation.handled_at).is_not_none()
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("denied")

    def test_cant_deny_if_regular_user(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_deny_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)

    def test_cant_deny_if_status_not_allowed_states(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        self.reservation.state = STATE_CHOICES.CREATED
        self.reservation.save()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Only reservations with state as requires_handling, confirmed can be denied."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("DENYING_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)
        assert_that(self.reservation.handling_details).is_empty()

    def test_denying_fails_when_reason_missing(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        input_data.pop("denyReasonPk")
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        assert_that(self.reservation.handling_details).is_empty()

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    def test_handling_details_does_not_save_to_working_memo(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(self.reservation.handling_details).is_not_equal_to(self.reservation.working_memo)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_deny_success_with_empty_handling_details(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        input_data["handlingDetails"] = ""
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("state")).is_equal_to(STATE_CHOICES.DENIED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(self.reservation.handling_details).is_equal_to("")
        assert_that(self.reservation.handled_at).is_not_none()
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("denied")

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_denying_staff_type_reservation_does_not_send_email(self):
        self.reservation.type = ReservationType.STAFF
        self.reservation.save()

        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        input_data["handlingDetails"] = ""
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(len(mail.outbox)).is_equal_to(0)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_denying_behalf_type_reservation_does_not_send_email(self):
        self.reservation.type = ReservationType.BEHALF
        self.reservation.save()

        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        input_data["handlingDetails"] = ""
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(len(mail.outbox)).is_equal_to(0)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_denying_blocked_type_reservation_does_not_send_email(self):
        self.reservation.type = ReservationType.BLOCKED
        self.reservation.save()

        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        input_data["handlingDetails"] = ""
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(len(mail.outbox)).is_equal_to(0)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    def test_can_deny_when_reservation_started_but_not_ended(self):
        self.reservation.type = ReservationType.BLOCKED
        self.reservation.save()

        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)

        with freezegun.freeze_time("2021-10-12T13:30:00Z"):
            response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    def test_cannot_deny_confirmed_when_reservation_ended(self):
        self.reservation.type = ReservationType.BLOCKED
        self.reservation.state = STATE_CHOICES.CONFIRMED
        self.reservation.save()

        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

        with freezegun.freeze_time("2021-10-12T15:30:00Z"):
            response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(self.reservation.handling_details).is_empty()

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
    )
    def test_can_deny_requires_handling_when_reservation_ended(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)

        with freezegun.freeze_time("2021-10-12T15:30:00Z"):
            response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        assert_that(deny_data.get("state")).is_equal_to(STATE_CHOICES.DENIED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(self.reservation.handling_details).is_equal_to("no can do")
        assert_that(self.reservation.handled_at).is_not_none()

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
    )
    def test_deny_does_not_send_notification_when_normal_type_reservation_ended(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_deny_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)

        with freezegun.freeze_time("2021-10-12T15:30:00Z"):
            response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        deny_data = content.get("data").get("denyReservation")
        assert_that(deny_data.get("errors")).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        assert_that(self.reservation.handled_at).is_not_none()
        assert_that(len(mail.outbox)).is_equal_to(0)
