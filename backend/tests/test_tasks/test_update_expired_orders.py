from __future__ import annotations

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import WebShopPaymentGateway, WebShopPaymentStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.tasks import update_expired_orders_task
from utils.date_utils import local_datetime

from tests.factories import PaymentFactory, PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__cancelled(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CANCELLED,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED

    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__expired(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CREATED,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.EXPIRED

    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__expired__not_cancelled_in_verkkokauppa(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CREATED,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.EXPIRED

    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(EmailService.send_reservation_confirmed_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__paid(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.PAID_ONLINE,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID

    payment_order.reservation.refresh_from_db()
    assert payment_order.reservation.state == ReservationStateChoice.CONFIRMED

    assert VerkkokauppaAPIClient.get_payment.called is True

    assert EmailService.send_reservation_confirmed_email.called is True
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(EmailService.send_reservation_confirmed_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__paid_with_invoice(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.PAID_ONLINE,
        payment_gateway=WebShopPaymentGateway.INVOICE,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID_BY_INVOICE

    payment_order.reservation.refresh_from_db()
    assert payment_order.reservation.state == ReservationStateChoice.CONFIRMED

    assert VerkkokauppaAPIClient.get_payment.called is True

    assert EmailService.send_reservation_confirmed_email.called is True
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(EmailService.send_reservation_confirmed_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@patch_method(PindoraService.activate_access_code)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__paid__has_access_code(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
    )
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.PAID_ONLINE,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID

    payment_order.reservation.refresh_from_db()
    assert payment_order.reservation.state == ReservationStateChoice.CONFIRMED

    assert VerkkokauppaAPIClient.get_payment.called is True

    assert EmailService.send_reservation_confirmed_email.called is True
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is True
    assert PindoraService.activate_access_code.called is True


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__missing_from_verkkokauppa(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.EXPIRED

    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(SentryLogger.log_message)
@patch_method(VerkkokauppaAPIClient.get_payment, side_effect=GetPaymentError("mock-error"))
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__refresh_errors_are_logged(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.DRAFT

    assert VerkkokauppaAPIClient.get_payment.called is True

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__direct_payment__calculate_expiration_from_verkkokauppa_timestamp(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.DRAFT,
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    # Should use timestamp from Verkkokauppa payment to calculate whether the payment
    # is actually expired, not from our own 'PaymentOrder.created_at'.
    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CREATED,
        timestamp=local_datetime(2024, 1, 1, 11, 56),
    )

    update_expired_orders_task()

    assert VerkkokauppaAPIClient.get_payment.called is True

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.DRAFT


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__cancelled_before_overdue(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 12),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CANCELLED,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PENDING

    # Only overdue orders are checked
    assert VerkkokauppaAPIClient.get_payment.called is False


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__cancelled_after_overdue(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CANCELLED,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.EXPIRED

    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__payment_expired_but_not_overdue(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 12),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CREATED,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PENDING

    # Only overdue orders are checked
    assert VerkkokauppaAPIClient.get_payment.called is False


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__payment_not_expired_but_overdue(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CREATED,
        timestamp=local_datetime(2024, 1, 1, 11, 56),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PENDING

    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__payment_expired_and_overdue(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.CREATED,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.EXPIRED

    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(EmailService.send_reservation_confirmed_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__paid(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.PAID_ONLINE,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID

    assert VerkkokauppaAPIClient.get_payment.called is True

    assert EmailService.send_reservation_confirmed_email.called is False
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is False


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(EmailService.send_reservation_confirmed_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__paid_with_invoice(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.PAID_ONLINE,
        payment_gateway=WebShopPaymentGateway.INVOICE,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID_BY_INVOICE

    assert VerkkokauppaAPIClient.get_payment.called is True

    assert EmailService.send_reservation_confirmed_email.called is False
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is False


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(EmailService.send_reservation_confirmed_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@patch_method(PindoraService.activate_access_code)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__paid__has_access_code(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=False,
    )
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.PAID_ONLINE,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID

    assert VerkkokauppaAPIClient.get_payment.called is True

    assert EmailService.send_reservation_confirmed_email.called is False
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is False
    assert PindoraService.activate_access_code.called is True


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(EmailService.send_reservation_confirmed_email)
@patch_method(EmailService.send_reservation_confirmed_staff_notification_email)
@patch_method(PindoraService.activate_access_code)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__paid__has_access_code__already_active(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        access_type=AccessType.ACCESS_CODE,
        access_code_generated_at=local_datetime(),
        access_code_is_active=True,
    )
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    VerkkokauppaAPIClient.get_payment.return_value = PaymentFactory.create(
        status=WebShopPaymentStatus.PAID_ONLINE,
        timestamp=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID

    assert VerkkokauppaAPIClient.get_payment.called is True

    assert EmailService.send_reservation_confirmed_email.called is False
    assert EmailService.send_reservation_confirmed_staff_notification_email.called is False
    assert PindoraService.activate_access_code.called is False


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__missing_from_verkkokauppa(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.EXPIRED

    assert VerkkokauppaAPIClient.get_payment.called is True


@patch_method(VerkkokauppaAPIClient.get_payment, side_effect=GetPaymentError("mock-error"))
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_update_expired_orders__handled_payment__refresh_errors_are_logged(settings):
    settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES = 5

    reservation = ReservationFactory.create(state=ReservationStateChoice.CONFIRMED)
    payment_order = PaymentOrderFactory.create_at(
        reservation=reservation,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(2024, 1, 1, 11, 59),
        created_at=local_datetime(2024, 1, 1, 11, 55),
    )

    update_expired_orders_task()

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PENDING

    assert VerkkokauppaAPIClient.get_payment.called is True
