import uuid

import pytest

from merchants.models import OrderStatus
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from tests.factories import OrderFactory, PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method
from utils.sentry import SentryLogger

from .helpers import DELETE_MUTATION, get_delete_data

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__delete__waiting_for_payment_can_be_deleted(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__delete__call_webshop_cancel_and_mark_order_cancelled_on_delete(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    VerkkokauppaAPIClient.cancel_order.return_value = OrderFactory(status="cancelled")

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    assert VerkkokauppaAPIClient.cancel_order.called is True
    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__delete__dont_call_webshop_cancel_when_order_is_already_cancelled(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.CANCELLED
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    assert VerkkokauppaAPIClient.cancel_order.called is False
    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__delete__do_not_mark_order_cancelled_if_webshop_call_fails(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    VerkkokauppaAPIClient.cancel_order.return_value = OrderFactory(status="draft")

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    assert VerkkokauppaAPIClient.cancel_order.called is True
    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.DRAFT


@patch_method(SentryLogger.log_exception)
@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__delete__log_error_on_cancel_order_failure_but_mark_order_cancelled(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    VerkkokauppaAPIClient.cancel_order.side_effect = CancelOrderError("mock-error")

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED

    assert VerkkokauppaAPIClient.cancel_order.called is True
    assert SentryLogger.log_exception.called is True


def test_reservation__delete__cannot_delete_when_status_not_created_nor_waiting_for_payment(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.CONFIRMED)

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation which is not in created or waiting_for_payment state cannot be deleted."
    ]
    assert Reservation.objects.filter(pk=reservation.pk).exists() is True
