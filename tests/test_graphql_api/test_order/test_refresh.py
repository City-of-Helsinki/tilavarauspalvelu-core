import uuid

import pytest

from email_notification.helpers.reservation_email_notification_sender import ReservationEmailNotificationSender
from merchants.models import OrderStatus
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.types import PaymentStatus
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.choices import ReservationStateChoice
from tests.factories import PaymentFactory
from tests.helpers import UserType, patch_method

from .helpers import REFRESH_MUTATION, get_order

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_refresh_order__order_not_found(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)

    data = {"orderUuid": str(uuid.uuid4())}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert response.error_message() == "Order not found"


@patch_method(VerkkokauppaAPIClient.get_payment, return_value=None)
def test_refresh_order__payment_not_found(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()
    status = order.status

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1

    assert response.error_message() == "Unable to check order payment"

    order.refresh_from_db()
    assert order.status == status


@pytest.mark.parametrize(
    "status",
    [
        OrderStatus.PAID.value,
        OrderStatus.PAID_MANUALLY.value,
        OrderStatus.REFUNDED.value,
    ],
)
@patch_method(VerkkokauppaAPIClient.get_payment)
def test_refresh_order__status_skips_update(graphql, status):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()
    order.status = status
    order.save()

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 0

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": status,
    }


@pytest.mark.parametrize(
    "status",
    [
        PaymentStatus.CREATED.value,
        PaymentStatus.AUTHORIZED.value,
    ],
)
@patch_method(VerkkokauppaAPIClient.get_payment)
def test_refresh_order__status_causes_no_changes(graphql, status):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()
    order_status = order.status

    payment = PaymentFactory.create(status=status)
    VerkkokauppaAPIClient.get_payment.return_value = payment

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": order_status,
    }

    order.refresh_from_db()
    assert order.status == order_status


@patch_method(VerkkokauppaAPIClient.get_payment)
def test_refresh_order__cancelled_status_causes_cancellation(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()

    payment = PaymentFactory.create(status=PaymentStatus.CANCELLED.value)
    VerkkokauppaAPIClient.get_payment.return_value = payment

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": OrderStatus.CANCELLED.value,
    }

    order.refresh_from_db()
    assert order.status == OrderStatus.CANCELLED
    assert order.processed_at is not None


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
def test_refresh_order__paid_online_status_causes_paid_marking_and_no_notification(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()

    payment = PaymentFactory.create(status=PaymentStatus.PAID_ONLINE.value)
    VerkkokauppaAPIClient.get_payment.return_value = payment

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1
    assert ReservationEmailNotificationSender.send_confirmation_email.call_count == 0

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": OrderStatus.PAID.value,
    }

    order.refresh_from_db()
    assert order.status == OrderStatus.PAID
    assert order.processed_at is not None


@patch_method(VerkkokauppaAPIClient.get_payment)
@patch_method(ReservationEmailNotificationSender.send_confirmation_email)
def test_refresh_order__paid_online_status_sends_notification_if_reservation_waiting_for_payment(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()

    order.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
    order.reservation.save()

    payment = PaymentFactory.create(status=PaymentStatus.PAID_ONLINE.value)
    VerkkokauppaAPIClient.get_payment.return_value = payment

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1
    assert ReservationEmailNotificationSender.send_confirmation_email.call_count == 1

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": OrderStatus.PAID.value,
    }

    order.refresh_from_db()
    assert order.status == OrderStatus.PAID


@patch_method(VerkkokauppaAPIClient.get_payment, side_effect=GetPaymentError("Error"))
def test_refresh_order__payment_endpoint_error(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()
    order_status = order.status

    order.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
    order.reservation.save()

    data = {"orderUuid": str(order.remote_id)}
    response = graphql(REFRESH_MUTATION, input_data=data)

    assert VerkkokauppaAPIClient.get_payment.call_count == 1
    assert response.error_message() == "Unable to check order payment: problem with external service"

    order.refresh_from_db()
    assert order.status == order_status
