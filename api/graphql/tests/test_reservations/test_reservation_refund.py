import datetime
import json
from decimal import Decimal
from unittest import mock
from uuid import uuid4

import freezegun
from assertpy import assert_that
from django.test import override_settings
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from merchants.models import OrderStatus
from reservations.models import STATE_CHOICES
from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationMetadataSetFactory


@freezegun.freeze_time("2021-10-12T12:00:00Z")
@override_settings(
    CELERY_TASK_ALWAYS_EAGER=True,
)
class ReservationRefundTestCase(ReservationTestCaseBase):
    def setUp(self):
        super().setUp()
        metadata = ReservationMetadataSetFactory()
        self.reservation_unit.metadata_set = metadata
        self.reservation_unit.save()
        self.reservation = ReservationFactory(
            reservation_unit=[self.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()) - datetime.timedelta(hours=2),
            end=(datetime.datetime.now(tz=get_default_timezone()) - datetime.timedelta(hours=12)),
            state=STATE_CHOICES.CANCELLED,
            user=self.regular_joe,
            reservee_email="email@reservee",
            price_net=Decimal("10.0"),
        )
        self.payment_order = PaymentOrderFactory.create(
            reservation=self.reservation, status=OrderStatus.PAID, remote_id=uuid4()
        )

    def get_handle_query(self):
        return """
            mutation refundReservation($input: ReservationRefundMutationInput!) {
                refundReservation(input: $input) {
                    errors {
                        field
                        messages
                    }
                }
            }
        """

    def get_valid_refund_data(self):
        return {
            "pk": self.reservation.pk,
        }

    @mock.patch("reservations.tasks.refund_order")
    def test_refund_success_when_admin(self, mock_refund_order):
        refund = mock.MagicMock()
        refund.refund_id = uuid4()
        mock_refund_order.return_value = refund

        self.client.force_login(self.general_admin)

        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data.get("errors")).is_none()

        mock_refund_order.assert_called_with(self.payment_order.remote_id)

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.refund_id).is_equal_to(refund.refund_id)

    def test_cant_refund_if_regular_user(self):
        self.client.force_login(self.regular_joe)
        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to("No permission to mutate")
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.refund_id).is_none

    def test_cant_refund_if_invalid_state_and_not_in_the_past(self):
        self.client.force_login(self.general_admin)

        self.reservation.state = STATE_CHOICES.CONFIRMED
        self.reservation.end = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2)
        self.reservation.save()

        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "Only reservations in the past or in state CANCELLED or DENIED can be refunded."
        )
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.refund_id).is_none

    @mock.patch("reservations.tasks.refund_order")
    def test_refund_success_when_correct_state_and_not_in_the_past(self, mock_refund_order):
        self.reservation.state = STATE_CHOICES.CANCELLED
        self.reservation.end = datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=2)
        self.reservation.save()

        refund = mock.MagicMock()
        refund.refund_id = uuid4()
        mock_refund_order.return_value = refund

        self.client.force_login(self.general_admin)

        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data.get("errors")).is_none()

        mock_refund_order.assert_called_with(self.payment_order.remote_id)

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.refund_id).is_equal_to(refund.refund_id)

    @mock.patch("reservations.tasks.refund_order")
    def test_refund_success_when_invalid_state_and_in_the_past(self, mock_refund_order):
        self.reservation.state = STATE_CHOICES.CONFIRMED
        self.reservation.end = datetime.datetime.now(tz=get_default_timezone()) - datetime.timedelta(hours=2)
        self.reservation.save()

        refund = mock.MagicMock()
        refund.refund_id = uuid4()
        mock_refund_order.return_value = refund

        self.client.force_login(self.general_admin)

        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data.get("errors")).is_none()

        mock_refund_order.assert_called_with(self.payment_order.remote_id)

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.refund_id).is_equal_to(refund.refund_id)

    def test_cant_refund_if_payment_order_is_missing(self):
        self.client.force_login(self.general_admin)

        self.payment_order.delete()

        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "Only reservations with paid order can be refunded."
        )
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data).is_none()

    def test_cant_refund_if_payment_order_is_not_paid(self):
        self.client.force_login(self.general_admin)

        self.payment_order.status = OrderStatus.DRAFT
        self.payment_order.save()

        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "Only reservations with paid order can be refunded."
        )
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.refund_id).is_none

    def test_cant_refund_if_payment_order_is_waiting_for_refund(self):
        self.client.force_login(self.general_admin)

        self.payment_order.refund_id = uuid4()
        self.payment_order.save()

        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "Only reservations with paid order can be refunded."
        )
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.refund_id).is_none

    def test_cant_refund_if_reservation_price_is_zero(self):
        self.client.force_login(self.general_admin)

        self.reservation.price_net = Decimal("0.0")
        self.reservation.save()

        input_data = self.get_valid_refund_data()
        response = self.query(self.get_handle_query(), input_data=input_data)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        assert_that(content.get("errors")[0].get("message")).is_equal_to(
            "Only reservations with price greater than 0 can be refunded."
        )
        refund_data = content.get("data").get("refundReservation")
        assert_that(refund_data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.refund_id).is_none
