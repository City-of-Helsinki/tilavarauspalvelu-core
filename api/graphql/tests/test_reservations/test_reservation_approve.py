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
from permissions.models import UnitRole, UnitRoleChoice, UnitRolePermission
from reservations.choices import ReservationStateChoice
from tests.factories import EmailTemplateFactory, ReservationFactory, ReservationMetadataSetFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationApproveTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        metadata = ReservationMetadataSetFactory()
        self.reservation_unit.metadata_set = metadata
        self.reservation_unit.save()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1),
            end=(datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2)),
            state=ReservationStateChoice.REQUIRES_HANDLING,
            user=self.regular_joe,
            reservee_email="email@reservee",
        )
        EmailTemplateFactory(
            type=EmailType.RESERVATION_HANDLED_AND_CONFIRMED,
            content="",
            subject="approved",
        )
        EmailTemplateFactory(
            type=EmailType.STAFF_NOTIFICATION_RESERVATION_MADE,
            content="",
            subject="staff reservation made",
        )

    def get_handle_query(self):
        return """
            mutation approveReservation($input: ReservationApproveMutationInput!) {
                approveReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_approve_data(self):
        return {
            "pk": self.reservation.pk,
            "handlingDetails": "You're welcome.",
            "price": 10.59,
            "priceNet": 8.61,
        }

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_approve_success_when_admin(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_approve_data()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("approveReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(ReservationStateChoice.CONFIRMED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.handling_details).is_equal_to("You're welcome.")
        assert_that(self.reservation.handled_at).is_not_none()
        assert_that(self.reservation.price).is_equal_to(Decimal("10.59"))  # Float does not cause abnormality.
        assert_that(self.reservation.price_net).is_equal_to(Decimal("8.61"))
        assert_that(len(mail.outbox)).is_equal_to(2)
        assert_that(mail.outbox[0].subject).is_equal_to("approved")
        assert_that(mail.outbox[1].subject).is_equal_to("staff reservation made")

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_send_correct_emails_when_approved_price_is_zero(self):
        self.client.force_login(self.general_admin)

        input_data = self.get_valid_approve_data()
        input_data["price"] = 0.0
        input_data["priceNet"] = 0.0

        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("approveReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(ReservationStateChoice.CONFIRMED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.handling_details).is_equal_to("You're welcome.")
        assert_that(self.reservation.handled_at).is_not_none()
        assert_that(self.reservation.price).is_equal_to(Decimal("0.0"))  # Float does not cause abnormality.
        assert_that(self.reservation.price_net).is_equal_to(Decimal("0.0"))  # Float does not cause abnormality.
        assert_that(len(mail.outbox)).is_equal_to(2)
        assert_that(mail.outbox[0].subject).is_equal_to("approved")
        assert_that(mail.outbox[1].subject).is_equal_to("staff reservation made")

    def test_cant_approve_if_regular_user(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_approve_data()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        approve_data = content.get("data").get("approveReservation")
        assert_that(approve_data).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)

    def test_cant_approve_if_status_not_requires_handling(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_approve_data()
        self.reservation.state = ReservationStateChoice.CREATED
        self.reservation.save()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Only reservations with state as REQUIRES_HANDLING can be approved."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to("APPROVING_NOT_ALLOWED")

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CREATED)
        assert_that(self.reservation.handling_details).is_empty()

    def test_approving_fails_when_price_missing(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_approve_data()
        input_data.pop("price")
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        assert_that(self.reservation.handling_details).is_empty()

    def test_approving_fails_when_price_net_missing(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_approve_data()
        input_data.pop("priceNet")
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        assert_that(self.reservation.handling_details).is_empty()

    def test_approving_fails_when_handling_details_missing(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_approve_data()
        input_data.pop("handlingDetails")
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        assert_that(self.reservation.handling_details).is_empty()

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    def test_handling_details_does_not_save_to_working_memo(self):
        """Previously we had a feature which copied to handling details to working memo."""
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_approve_data()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.handling_details).is_not_equal_to(self.reservation.working_memo)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_approve_success_with_empty_handling_details(self):
        self.client.force_login(self.general_admin)
        input_data = self.get_valid_approve_data()
        input_data["handlingDetails"] = ""
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("approveReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(ReservationStateChoice.CONFIRMED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(self.reservation.handling_details).is_equal_to("")
        assert_that(self.reservation.handled_at).is_not_none()
        assert_that(self.reservation.price).is_equal_to(Decimal("10.59"))  # Float does not cause abnormality.
        assert_that(self.reservation.price_net).is_equal_to(Decimal("8.61"))
        assert_that(len(mail.outbox)).is_equal_to(2)
        assert_that(mail.outbox[0].subject).is_equal_to("approved")
        assert_that(mail.outbox[1].subject).is_equal_to("staff reservation made")

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

        self.reservation.user = reserver_staff_user
        self.reservation.save()

        self.client.force_login(reserver_staff_user)

        input_data = self.get_valid_approve_data()
        input_data["handlingDetails"] = ""
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        approve_data = content.get("data").get("approveReservation")
        assert_that(approve_data.get("errors")).is_none()
        assert_that(approve_data.get("state")).is_equal_to(ReservationStateChoice.CONFIRMED.upper())
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)

    def test_unit_reserver_cant_approve_other_reservation(self):
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

        input_data = self.get_valid_approve_data()
        input_data["handlingDetails"] = ""
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.REQUIRES_HANDLING)
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")
