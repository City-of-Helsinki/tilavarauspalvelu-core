import uuid

import pytest

from reservations.enums import ReservationStateChoice
from reservations.models import Reservation
from tests.factories import OrderFactory, PaymentFactory, PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method
from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.utils.email.reservation_email_notification_sender import ReservationEmailNotificationSender
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.utils.verkkokauppa.payment.types import PaymentStatus
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.sentry import SentryLogger

from .helpers import DELETE_MUTATION, get_delete_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@patch_method(VerkkokauppaAPIClient.get_payment)  # Not called, as reservation has no PaymentOrders
def test_reservation__delete__waiting_for_payment__can_be_deleted(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.called is False
    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=PaymentFactory.create(status=PaymentStatus.CREATED.value))
@patch_method(VerkkokauppaAPIClient.cancel_order)
@pytest.mark.parametrize(
    "order_status",
    [
        # Mark order as cancelled when webshop call succeeds
        OrderStatus.CANCELLED,
        # Do not mark order cancelled if webshop call fails to cancel with and e.g. returns status="draft"
        OrderStatus.DRAFT,
    ],
)
def test_reservation__delete__draft__call_webshop_cancel(graphql, order_status):
    VerkkokauppaAPIClient.cancel_order.return_value = OrderFactory(status=order_status.value.lower())

    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is True
    payment_order.refresh_from_db()
    assert payment_order.status == order_status


@patch_method(
    VerkkokauppaAPIClient.get_payment,
    return_value=PaymentFactory.create(status=PaymentStatus.CANCELLED.value),
)
@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__delete__cancelled__dont_call_webshop_cancel_when_order_is_already_cancelled(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.CANCELLED
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is False
    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=PaymentFactory.create(status=PaymentStatus.CREATED.value))
@patch_method(VerkkokauppaAPIClient.cancel_order, side_effect=CancelOrderError("mock-error"))
@patch_method(SentryLogger.log_exception)
def test_reservation__delete__webshop_error__log_error_on_cancel_order_failure_but_mark_order_cancelled(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is True
    assert SentryLogger.log_exception.call_count == 1


def test_reservation__delete__confirmed__cannot_delete_when_status_not_created_nor_waiting_for_payment(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.CONFIRMED)

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation which is not in ['CREATED', 'WAITING_FOR_PAYMENT'] state cannot be deleted."
    ]
    assert Reservation.objects.filter(pk=reservation.pk).exists() is True


@patch_method(VerkkokauppaAPIClient.get_payment, PaymentFactory.create(status=PaymentStatus.PAID_ONLINE.value))
@patch_method(VerkkokauppaAPIClient.cancel_order)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
def test_reservation__delete__reservation_is_in_draft_state_but_paid_in_verkkokauppa(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation which is paid cannot be deleted."]
    assert Reservation.objects.filter(pk=reservation.pk).exists() is True

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is False
    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID

    assert ReservationEmailNotificationSender.send_confirmation_email.called is True
