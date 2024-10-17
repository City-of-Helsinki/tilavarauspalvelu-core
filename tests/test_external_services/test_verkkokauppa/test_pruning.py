from datetime import timedelta

import pytest
from freezegun import freeze_time

from tests.factories import PaymentFactory, PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method
from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.tasks import update_expired_orders_task
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.utils.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.utils.verkkokauppa.payment.types import PaymentStatus
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime
from utils.sentry import SentryLogger

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@pytest.fixture
def order():
    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    return PaymentOrderFactory.create(created_at=local_datetime(), reservation=reservation, status=OrderStatus.DRAFT)


@patch_method(VerkkokauppaAPIClient.get_payment)
def test_verkkokauppa_pruning__update_expired_orders__handle_cancelled_orders(order):
    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(status=PaymentStatus.CANCELLED.value)

    with freeze_time(order.created_at + timedelta(minutes=6)):
        update_expired_orders_task()

    order.refresh_from_db()
    assert order.status == OrderStatus.CANCELLED
    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_verkkokauppa_pruning__update_expired_orders__handle_expired_orders(order):
    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=PaymentStatus.CREATED.value,
        timestamp=order.created_at,
    )

    with freeze_time(order.created_at + timedelta(minutes=6)):
        update_expired_orders_task()

    order.refresh_from_db()
    assert order.status == OrderStatus.EXPIRED
    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is True


@patch_method(EmailService.send_reservation_confirmed_email)
@patch_method(EmailService.send_staff_notification_reservation_made_email)
@patch_method(VerkkokauppaAPIClient.get_payment)
def test_verkkokauppa_pruning__update_expired_orders__handle_paid_orders(order):
    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(status=PaymentStatus.PAID_ONLINE.value)

    with freeze_time(order.created_at + timedelta(minutes=6)):
        update_expired_orders_task()

    order.refresh_from_db()
    assert order.status == OrderStatus.PAID

    order.reservation.refresh_from_db()
    assert order.reservation.state == ReservationStateChoice.CONFIRMED
    assert VerkkokauppaAPIClient.get_payment.called is True

    assert EmailService.send_reservation_confirmed_email.called is True
    assert EmailService.send_staff_notification_reservation_made_email.called is True


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_verkkokauppa_pruning__update_expired_orders__handle_missing_payment(order):
    with freeze_time(order.created_at + timedelta(minutes=6)):
        update_expired_orders_task()

    order.refresh_from_db()
    assert order.status == OrderStatus.EXPIRED
    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is True


@patch_method(SentryLogger.log_exception)
@patch_method(VerkkokauppaAPIClient.get_payment, side_effect=GetPaymentError("mock-error"))
def test_verkkokauppa_pruning__update_expired_orders__get_payment_errors_are_logged(order):
    with freeze_time(order.created_at + timedelta(minutes=6)):
        update_expired_orders_task()

    order.refresh_from_db()
    assert order.status == OrderStatus.DRAFT
    assert VerkkokauppaAPIClient.get_payment.called is True
    assert SentryLogger.log_exception.call_count == 1


@patch_method(SentryLogger.log_exception)
@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(VerkkokauppaAPIClient.cancel_order, side_effect=CancelOrderError("mock-error"))
def test_verkkokauppa_pruning__update_expired_orders__cancel_error_errors_are_logged(order):
    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=PaymentStatus.CREATED.value,
        timestamp=order.created_at,
    )

    with freeze_time(order.created_at + timedelta(minutes=6)):
        update_expired_orders_task()

    order.refresh_from_db()
    assert order.status == OrderStatus.DRAFT
    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is True
    assert SentryLogger.log_exception.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_verkkokauppa_pruning__update_expired_orders__give_more_time_if_user_entered_to_payment_phase(order):
    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=PaymentStatus.CREATED.value,
        timestamp=order.created_at + timedelta(minutes=4),
    )

    with freeze_time(order.created_at + timedelta(minutes=6)):
        update_expired_orders_task()

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is False

    order.refresh_from_db()
    assert order.status == OrderStatus.DRAFT
