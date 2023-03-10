import datetime
import json
from decimal import Decimal
from unittest import mock
from uuid import uuid4

import freezegun
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from email_notification.models import EmailType
from email_notification.tests.factories import EmailTemplateFactory
from merchants.models import OrderStatus, PaymentType
from merchants.tests.factories import PaymentOrderFactory
from reservation_units.tests.factories import ReservationUnitCancellationRuleFactory
from reservations.models import STATE_CHOICES
from reservations.tests.factories import (
    ReservationCancelReasonFactory,
    ReservationFactory,
)


@freezegun.freeze_time("2021-10-12T12:00:00Z")
class ReservationCancellationTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        self.cancel_reason = ReservationCancelReasonFactory(reason="good_reason")
        self.cancel_rule = ReservationUnitCancellationRuleFactory(
            name="default rule",
            can_be_cancelled_time_before=datetime.timedelta(hours=0),
            needs_handling=False,
        )
        self.reservation_unit.cancellation_rule = self.cancel_rule
        self.reservation_unit.save()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=(
                datetime.datetime.now(tz=get_default_timezone())
                + datetime.timedelta(hours=1)
            ),
            state=STATE_CHOICES.CONFIRMED,
            user=self.regular_joe,
            reservee_email="email@reservee",
        )

        EmailTemplateFactory(
            type=EmailType.RESERVATION_CANCELLED,
            content="",
            subject="cancelled",
        )

    def get_cancel_query(self):
        return """
            mutation cancelReservation($input: ReservationCancellationMutationInput!) {
                cancelReservation(input: $input) {
                    state
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_cancel_data(self):
        return {"pk": self.reservation.pk, "cancelReasonPk": self.cancel_reason.id}

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    def test_cancel_reservation_changes_state(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        assert_that(cancel_data.get("state")).is_equal_to(
            STATE_CHOICES.CANCELLED.upper()
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CANCELLED)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    def test_cancel_reservation_adds_reason(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        assert_that(cancel_data.get("state")).is_equal_to(
            STATE_CHOICES.CANCELLED.upper()
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.cancel_reason).is_equal_to(self.cancel_reason)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    def test_cancel_reservation_adds_cancel_details(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        details = "wantitso"
        input_data["cancelDetails"] = details
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        assert_that(cancel_data.get("state")).is_equal_to(
            STATE_CHOICES.CANCELLED.upper()
        )
        self.reservation.refresh_from_db()
        assert_that(self.reservation.cancel_details).is_equal_to(details)

    def test_cancel_reservation_fails_if_state_is_not_confirmed(self):
        self.client.force_login(self.regular_joe)
        self.reservation.state = STATE_CHOICES.CREATED
        self.reservation.save()
        input_data = self.get_valid_cancel_data()
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Only reservations in confirmed state can be cancelled through this."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "CANCELLATION_NOT_ALLOWED"
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CREATED)

    def test_cancel_reservation_fails_if_cancel_reason_not_given(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        input_data.pop("cancelReasonPk")
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_cancel_reservation_fails_on_wrong_user(self):
        unauthorized_user = get_user_model().objects.create()
        self.client.force_login(unauthorized_user)
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        input_data = self.get_valid_cancel_data()
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_cancel_reservation_fails_with_rules_time_is_due(self):
        rule = ReservationUnitCancellationRuleFactory(
            can_be_cancelled_time_before=datetime.timedelta(hours=12)
        )
        self.reservation_unit.cancellation_rule = rule
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation cannot be cancelled because the cancellation period has expired."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "CANCELLATION_NOT_ALLOWED"
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    def test_cancel_reservation_succeed_with_rule_set_and_in_time(self):
        rule = ReservationUnitCancellationRuleFactory(
            can_be_cancelled_time_before=datetime.timedelta(hours=1)
        )
        self.reservation_unit.cancellation_rule = rule
        self.reservation_unit.save()

        now = datetime.datetime.now(tz=get_default_timezone())
        reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=now + datetime.timedelta(hours=1),
            end=(now + datetime.timedelta(hours=2)),
            state=STATE_CHOICES.CONFIRMED,
            user=self.regular_joe,
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        input_data["pk"] = reservation.id
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        reservation.refresh_from_db()
        assert_that(reservation.state).is_equal_to(STATE_CHOICES.CANCELLED)

    def test_cancel_reservation_fails_when_reservation_in_past(self):
        now = datetime.datetime.now(tz=get_default_timezone())
        reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=now - datetime.timedelta(hours=2),
            end=now - datetime.timedelta(hours=1),
            state=STATE_CHOICES.CONFIRMED,
            user=self.regular_joe,
        )

        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        input_data["pk"] = reservation.id
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation cannot be cancelled because the cancellation period has expired."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "CANCELLATION_NOT_ALLOWED"
        )

        reservation.refresh_from_db()
        assert_that(reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    def test_cancel_fails_if_no_rule(self):
        self.reservation_unit.cancellation_rule = None
        self.reservation_unit.save()

        self.client.force_login(self.regular_joe)
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        input_data = self.get_valid_cancel_data()
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)

        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0]["message"]).is_equal_to(
            "Reservation cannot be cancelled thus no cancellation rule."
        )
        assert_that(content.get("errors")[0]["extensions"]["error_code"]).is_equal_to(
            "CANCELLATION_NOT_ALLOWED"
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=True,
        EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    )
    def test_cancellation_sends_email_notification(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_cancel_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()
        assert_that(len(mail.outbox)).is_equal_to(1)
        assert_that(mail.outbox[0].subject).is_equal_to("cancelled")

    @override_settings(
        CELERY_TASK_ALWAYS_EAGER=True,
        SEND_RESERVATION_NOTIFICATION_EMAILS=False,
    )
    @mock.patch("reservations.tasks.refund_order")
    def test_cancellation_starts_refund_process_on_paid_reservation(
        self, mock_refund_order
    ):
        self.client.force_login(self.regular_joe)

        self.reservation.price_net = Decimal("124.00")
        self.reservation.save()

        remote_id = uuid4()
        payment_order = PaymentOrderFactory.create(
            reservation=self.reservation,
            remote_id=remote_id,
            payment_type=PaymentType.ONLINE,
            status=OrderStatus.PAID,
            price_net=Decimal("100.00"),
            price_vat=Decimal("24.00"),
            price_total=Decimal("124.00"),
        )

        refund_id = uuid4()
        mock_refund = mock.MagicMock()
        mock_refund.refund_id = refund_id

        mock_refund_order.return_value = mock_refund

        input_data = self.get_valid_cancel_data()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

        response = self.query(self.get_cancel_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        cancel_data = content.get("data").get("cancelReservation")
        assert_that(cancel_data.get("errors")).is_none()

        mock_refund_order.assert_called_with(remote_id)

        payment_order.refresh_from_db()
        assert_that(payment_order.refund_id).is_equal_to(refund_id)
