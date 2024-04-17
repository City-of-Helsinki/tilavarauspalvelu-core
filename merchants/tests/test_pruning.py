import uuid
from datetime import datetime, timedelta

from django.test import TestCase, override_settings
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.models import OrderStatus
from merchants.pruning import update_expired_orders
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.types import PaymentStatus as WebShopPaymentStatus
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.choices import ReservationStateChoice
from tests.factories import PaymentFactory, PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method
from utils.sentry import SentryLogger

DEFAULT_TIMEZONE = get_default_timezone()


@override_settings(VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES=5)
@freeze_time(datetime(2022, 11, 28, 10, 10, 0, tzinfo=DEFAULT_TIMEZONE))
class UpdateExpiredOrderTestCase(TestCase):
    def setUp(self) -> None:
        self.reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
        return super().setUp()

    @patch_method(VerkkokauppaAPIClient.get_payment)
    def test_handle_cancelled_orders(self):
        VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory(status=WebShopPaymentStatus.CANCELLED.value)

        six_minutes_ago = datetime.now(tz=DEFAULT_TIMEZONE) - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid.uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=DEFAULT_TIMEZONE)):
            update_expired_orders()

        order.refresh_from_db()
        assert order.status == OrderStatus.CANCELLED

    @patch_method(ReservationEmailNotificationSender.send_confirmation_email)
    @patch_method(VerkkokauppaAPIClient.get_payment)
    def test_handle_paid_orders(self):
        VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory(status=WebShopPaymentStatus.PAID_ONLINE.value)

        six_minutes_ago = datetime.now() - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid.uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=DEFAULT_TIMEZONE)):
            update_expired_orders()

        order.refresh_from_db()
        assert order.status == OrderStatus.PAID

        self.reservation.refresh_from_db()
        assert self.reservation.state == ReservationStateChoice.CONFIRMED

        assert ReservationEmailNotificationSender.send_confirmation_email.called is True

    @patch_method(VerkkokauppaAPIClient.get_payment)
    @patch_method(VerkkokauppaAPIClient.cancel_order)
    def test_handle_expired_orders(self):
        six_minutes_ago = datetime.now(tz=DEFAULT_TIMEZONE) - timedelta(minutes=6)

        VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory(
            status=WebShopPaymentStatus.CREATED.value,
            timestamp=six_minutes_ago,
        )

        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid.uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=DEFAULT_TIMEZONE)):
            update_expired_orders()

        assert VerkkokauppaAPIClient.cancel_order.called is True

        order.refresh_from_db()
        assert order.status == OrderStatus.EXPIRED

    @patch_method(VerkkokauppaAPIClient.get_payment)
    @patch_method(VerkkokauppaAPIClient.cancel_order)
    def test_handle_missing_payment(self):
        VerkkokauppaAPIClient.get_payment.return_value = None

        six_minutes_ago = datetime.now() - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT.value,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid.uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=DEFAULT_TIMEZONE)):
            update_expired_orders()

        assert VerkkokauppaAPIClient.cancel_order.called is True

        order.refresh_from_db()
        assert order.status == OrderStatus.EXPIRED

    @patch_method(SentryLogger.log_exception)
    @patch_method(VerkkokauppaAPIClient.get_payment)
    def test_get_payment_errors_are_logged(self):
        VerkkokauppaAPIClient.get_payment.side_effect = GetPaymentError("mock-error")

        six_minutes_ago = datetime.now() - timedelta(minutes=6)
        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT.value,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid.uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=DEFAULT_TIMEZONE)):
            update_expired_orders()

        order.refresh_from_db()
        assert order.status == OrderStatus.DRAFT
        assert SentryLogger.log_exception.called is True

    @patch_method(SentryLogger.log_exception)
    @patch_method(VerkkokauppaAPIClient.get_payment)
    @patch_method(VerkkokauppaAPIClient.cancel_order, side_effect=CancelOrderError("mock-error"))
    def test_cancel_error_errors_are_logged(self):
        six_minutes_ago = datetime.now(tz=DEFAULT_TIMEZONE) - timedelta(minutes=6)
        VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory(
            status=WebShopPaymentStatus.CREATED.value,
            timestamp=six_minutes_ago,
        )

        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid.uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=DEFAULT_TIMEZONE)):
            update_expired_orders()

        order.refresh_from_db()
        assert order.status == OrderStatus.DRAFT
        assert SentryLogger.log_exception.called is True

    @patch_method(VerkkokauppaAPIClient.get_payment)
    @patch_method(VerkkokauppaAPIClient.cancel_order)
    def test_give_more_time_if_user_entered_to_payment_phase(self):
        four_minutes_in_the_future = datetime.now(tz=DEFAULT_TIMEZONE) + timedelta(minutes=4)
        six_minutes_ago = datetime.now(tz=DEFAULT_TIMEZONE) - timedelta(minutes=6)

        VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory(
            status=WebShopPaymentStatus.CREATED.value,
            timestamp=four_minutes_in_the_future,
        )

        order = PaymentOrderFactory.create(
            status=OrderStatus.DRAFT,
            created_at=six_minutes_ago,
            reservation=self.reservation,
            remote_id=uuid.uuid4(),
        )

        with freeze_time(datetime(2022, 11, 28, 10, 15, 0, tzinfo=DEFAULT_TIMEZONE)):
            update_expired_orders()

        assert VerkkokauppaAPIClient.get_payment.called is True
        assert VerkkokauppaAPIClient.cancel_order.called is False

        order.refresh_from_db()
        assert order.status == OrderStatus.DRAFT
