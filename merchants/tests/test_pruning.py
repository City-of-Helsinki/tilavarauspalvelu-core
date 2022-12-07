from datetime import datetime, timedelta
from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.test import TestCase
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from merchants.models import OrderStatus
from merchants.tests.factories import PaymentOrderFactory
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.test.factories import PaymentFactory
from merchants.verkkokauppa.payment.types import PaymentStatus as WebShopPaymentStatus
from reservations.models import STATE_CHOICES
from reservations.tests.factories import ReservationFactory

from ..pruning import update_expired_orders

TIMEZONE = get_default_timezone()


@freeze_time(datetime(2022, 11, 28, 10, 10, 0, tzinfo=TIMEZONE))
class UpdateExpiredOrderTestCase(TestCase):
    def setUp(self) -> None:
        self.reservation = ReservationFactory.create(
            state=STATE_CHOICES.WAITING_FOR_PAYMENT
        )
        return super().setUp()

    @mock.patch("merchants.pruning.get_payment")
    def test_handle_cancelled_orders(self, mock_get_payment):
        mock_get_payment.return_value = PaymentFactory(
            status=WebShopPaymentStatus.CANCELLED
        )

        six_minutes_ago = datetime.now() - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=TIMEZONE)):
            update_expired_orders(5)

        order.refresh_from_db()
        assert_that(order.status).is_equal_to(OrderStatus.CANCELLED)

    @mock.patch("merchants.pruning.send_confirmation_email")
    @mock.patch("merchants.pruning.get_payment")
    def test_handle_paid_orders(self, mock_get_payment, mock_confirmation_email):
        mock_get_payment.return_value = PaymentFactory(
            status=WebShopPaymentStatus.PAID_ONLINE
        )

        six_minutes_ago = datetime.now() - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=TIMEZONE)):
            update_expired_orders(5)

        order.refresh_from_db()
        assert_that(order.status).is_equal_to(OrderStatus.PAID)

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)

        assert_that(mock_confirmation_email.called).is_true()

    @mock.patch("merchants.pruning.cancel_order")
    @mock.patch("merchants.pruning.get_payment")
    def test_handle_expired_orders(self, mock_get_payment, mock_cancel_order):
        mock_get_payment.return_value = PaymentFactory(
            status=WebShopPaymentStatus.CREATED
        )

        six_minutes_ago = datetime.now() - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=TIMEZONE)):
            update_expired_orders(5)

        assert_that(mock_cancel_order.called).is_true()

        order.refresh_from_db()
        assert_that(order.status).is_equal_to(OrderStatus.EXPIRED)

    @mock.patch("merchants.pruning.capture_message")
    @mock.patch("merchants.pruning.get_payment")
    def test_get_payment_errors_are_logged(
        self, mock_get_payment, mock_capture_message
    ):
        mock_get_payment.side_effect = GetPaymentError("mock-error")

        six_minutes_ago = datetime.now() - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=TIMEZONE)):
            update_expired_orders(5)

        order.refresh_from_db()
        assert_that(order.status).is_equal_to(OrderStatus.DRAFT)
        assert_that(mock_capture_message.called).is_true()

    @mock.patch("merchants.pruning.capture_message")
    @mock.patch("merchants.pruning.cancel_order")
    @mock.patch("merchants.pruning.get_payment")
    def test_cancel_error_errors_are_logged(
        self, mock_get_payment, mock_cancel_order, mock_capture_message
    ):
        mock_get_payment.return_value = PaymentFactory(
            status=WebShopPaymentStatus.CREATED
        )
        mock_cancel_order.side_effect = CancelOrderError("mock-error")

        six_minutes_ago = datetime.now() - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=TIMEZONE)):
            update_expired_orders(5)

        order.refresh_from_db()
        assert_that(order.status).is_equal_to(OrderStatus.DRAFT)
        assert_that(mock_capture_message.called).is_true()
