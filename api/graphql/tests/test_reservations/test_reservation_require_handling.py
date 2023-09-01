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
from reservations.models import STATE_CHOICES
from tests.factories import (
    EmailTemplateFactory,
    ReservationFactory,
    ReservationMetadataSetFactory,
    ReservationUnitFactory,
)


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class RequireHandlingForReservationTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        metadata = ReservationMetadataSetFactory()
        self.reservation_unit.metadata_set = metadata
        self.reservation_unit.save()
        reservation_unit = ReservationUnitFactory()
        self.confirmed_reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1),
            end=(datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2)),
            state=STATE_CHOICES.CONFIRMED,
            user=self.regular_joe,
            reservee_email="email@reservee",
        )
        self.denied_reservation = ReservationFactory(
            reservation_unit=[reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1),
            end=(datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2)),
            state=STATE_CHOICES.DENIED,
            user=self.regular_joe,
            reservee_email="email@reservee",
        )

        EmailTemplateFactory(
            type=EmailType.HANDLING_REQUIRED_RESERVATION,
            content="",
            subject="handling",
        )
        EmailTemplateFactory(
            type=EmailType.STAFF_NOTIFICATION_RESERVATION_REQUIRES_HANDLING,
            content="",
            subject="staff requires handling",
        )

    def get_require_handling_query(self):
        return """
            mutation requireHandlingForReservation($input: ReservationRequiresHandlingMutationInput!) {
                requireHandlingForReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_require_handling_succeed_on_confirmed_reservation(self):
        self.client.force_login(self.general_admin)
        input_data = {"pk": self.confirmed_reservation.id}
        assert_that(self.confirmed_reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_require_handling_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("requireHandlingForReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING.upper())
        self.confirmed_reservation.refresh_from_db()
        assert_that(self.confirmed_reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("staff requires handling")

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_require_handling_succeed_on_denied_reservation(self):
        self.client.force_login(self.general_admin)
        input_data = {"pk": self.denied_reservation.id}
        assert_that(self.denied_reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        response = self.query(self.get_require_handling_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("requireHandlingForReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING.upper())
        self.denied_reservation.refresh_from_db()
        assert_that(self.denied_reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)
        assert_that(len(mail.outbox)).is_equal_to(0)

    def test_cant_deny_if_regular_user(self):
        self.client.force_login(self.regular_joe)
        input_data = {"pk": self.denied_reservation.id}
        assert_that(self.denied_reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        response = self.query(self.get_require_handling_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        deny_data = content.get("data").get("requireHandlingForReservation")
        assert_that(deny_data).is_none()
        self.denied_reservation.refresh_from_db()
        assert_that(self.denied_reservation.state).is_equal_to(STATE_CHOICES.DENIED)

    @override_settings(CELERY_TASK_ALWAYS_EAGER=True)
    def test_unit_reserver_can_approve_own_reservation(self):
        reserver_staff_user = get_user_model().objects.create(
            username="res",
            first_name="res",
            last_name="erver",
            email="res.erver@foo.com",
        )
        UnitRoleChoice.objects.create(
            code="staff",
            verbose_name="staff reserver person",
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

        self.confirmed_reservation.user = reserver_staff_user
        self.confirmed_reservation.save()

        self.client.force_login(reserver_staff_user)

        input_data = {"pk": self.confirmed_reservation.id}
        assert_that(self.confirmed_reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_require_handling_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("requireHandlingForReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING.upper())
        self.confirmed_reservation.refresh_from_db()
        assert_that(self.confirmed_reservation.state).is_equal_to(STATE_CHOICES.REQUIRES_HANDLING)

    def test_unit_reserver_cant_require_handling_other_reservation(self):
        reserver_staff_user = get_user_model().objects.create(
            username="res",
            first_name="res",
            last_name="erver",
            email="res.erver@foo.com",
        )
        UnitRoleChoice.objects.create(
            code="staff",
            verbose_name="staff reserver person",
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

        input_data = {"pk": self.denied_reservation.id}
        assert_that(self.denied_reservation.state).is_equal_to(STATE_CHOICES.DENIED)
        response = self.query(self.get_require_handling_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")
