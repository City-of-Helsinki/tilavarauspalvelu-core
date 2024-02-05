import datetime
import uuid
from unittest.mock import patch

import freezegun
import pytest

from merchants.models import OrderStatus
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.types import PaymentStatus
from reservations.choices import ReservationStateChoice
from tests.factories import PaymentFactory
from tests.helpers import UserType

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


def test_refresh_order__payment_not_found(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()
    status = order.status

    data = {"orderUuid": str(order.remote_id)}

    with patch("api.graphql.types.merchants.mutations.get_payment", return_value=None) as mock:
        response = graphql(REFRESH_MUTATION, input_data=data)

    assert mock.call_count == 1

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
def test_refresh_order__status_skips_update(graphql, status):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()

    order.status = status
    order.save()

    data = {"orderUuid": str(order.remote_id)}

    with patch("api.graphql.types.merchants.mutations.get_payment") as mock:
        response = graphql(REFRESH_MUTATION, input_data=data)

    assert mock.call_count == 0

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
def test_refresh_order__status_causes_no_changes(graphql, status):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()
    order_status = order.status

    data = {"orderUuid": str(order.remote_id)}

    payment = PaymentFactory.create(status=status)
    with patch("api.graphql.types.merchants.mutations.get_payment", return_value=payment) as mock:
        response = graphql(REFRESH_MUTATION, input_data=data)

    assert mock.call_count == 1

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": order_status,
    }

    order.refresh_from_db()
    assert order.status == order_status


@freezegun.freeze_time("2022-01-01T12:00:00Z")
def test_refresh_order__cancelled_status_causes_cancellation(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()

    data = {"orderUuid": str(order.remote_id)}

    payment = PaymentFactory.create(status=PaymentStatus.CANCELLED.value)
    with patch("api.graphql.types.merchants.mutations.get_payment", return_value=payment) as mock:
        response = graphql(REFRESH_MUTATION, input_data=data)

    assert mock.call_count == 1

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": OrderStatus.CANCELLED.value,
    }

    order.refresh_from_db()
    assert order.status == OrderStatus.CANCELLED
    assert order.processed_at == datetime.datetime.fromisoformat("2022-01-01T12:00:00+02:00")


@freezegun.freeze_time("2022-01-01T12:00:00Z")
def test_refresh_order__paid_online_status_causes_paid_marking_and_no_notification(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()

    data = {"orderUuid": str(order.remote_id)}

    payment = PaymentFactory.create(status=PaymentStatus.PAID_ONLINE.value)
    with (
        patch("api.graphql.types.merchants.mutations.get_payment", return_value=payment) as mock_1,
        patch("api.graphql.types.merchants.mutations.send_confirmation_email") as mock_2,
    ):
        response = graphql(REFRESH_MUTATION, input_data=data)

    assert mock_1.call_count == 1
    assert mock_2.call_count == 0

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": OrderStatus.PAID.value,
    }

    order.refresh_from_db()
    assert order.status == OrderStatus.PAID
    assert order.processed_at == datetime.datetime.fromisoformat("2022-01-01T12:00:00+02:00")


def test_refresh_order__paid_online_status_sends_notification_if_reservation_waiting_for_payment(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()

    order.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
    order.reservation.save()

    data = {"orderUuid": str(order.remote_id)}

    payment = PaymentFactory.create(status=PaymentStatus.PAID_ONLINE.value)
    with (
        patch("api.graphql.types.merchants.mutations.get_payment", return_value=payment) as mock_1,
        patch("api.graphql.types.merchants.mutations.send_confirmation_email") as mock_2,
    ):
        response = graphql(REFRESH_MUTATION, input_data=data)

    assert mock_1.call_count == 1
    assert mock_2.call_count == 1

    assert response.has_errors is False
    assert response.first_query_object == {
        "orderUuid": str(order.remote_id),
        "status": OrderStatus.PAID.value,
    }

    order.refresh_from_db()
    assert order.status == OrderStatus.PAID


def test_refresh_order__payment_endpoint_error(graphql):
    graphql.login_user_based_on_type(UserType.SUPERUSER)
    order = get_order()
    order_status = order.status

    order.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
    order.reservation.save()

    data = {"orderUuid": str(order.remote_id)}

    error = GetPaymentError("Error")
    with patch("api.graphql.types.merchants.mutations.get_payment", side_effect=error) as mock:
        response = graphql(REFRESH_MUTATION, input_data=data)

    assert mock.call_count == 1

    assert response.error_message() == "Unable to check order payment: problem with external service"

    order.refresh_from_db()
    assert order.status == order_status
