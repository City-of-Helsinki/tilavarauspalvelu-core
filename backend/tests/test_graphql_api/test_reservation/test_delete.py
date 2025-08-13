from __future__ import annotations

import uuid
from unittest.mock import patch

import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import WebShopPaymentStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import delete_pindora_reservation_task

from tests.factories import OrderFactory, PaymentFactory, PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method

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
    response = graphql(DELETE_MUTATION, variables={"input": data})

    assert VerkkokauppaAPIClient.get_payment.called is False
    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False


@patch_method(
    VerkkokauppaAPIClient.get_payment, return_value=PaymentFactory.create(status=WebShopPaymentStatus.CREATED.value)
)
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
    VerkkokauppaAPIClient.cancel_order.return_value = OrderFactory.create(status=order_status.value.lower())

    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is True
    payment_order.refresh_from_db()
    assert payment_order.status == order_status


@patch_method(
    VerkkokauppaAPIClient.get_payment,
    return_value=PaymentFactory.create(status=WebShopPaymentStatus.CANCELLED.value),
)
@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__delete__cancelled__dont_call_webshop_cancel_when_order_is_already_cancelled(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.CANCELLED
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is False
    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(
    VerkkokauppaAPIClient.get_payment,
    return_value=PaymentFactory.create(status=WebShopPaymentStatus.CREATED.value),
)
@patch_method(VerkkokauppaAPIClient.cancel_order, side_effect=CancelOrderError("mock-error"))
@patch_method(SentryLogger.log_message)
def test_reservation__delete__webshop_error__log_error_on_cancel_order_failure_but_mark_order_cancelled(graphql):
    reservation = ReservationFactory.create_for_delete(
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
    )
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(),
        reservation=reservation,
        status=OrderStatus.DRAFT,
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors
    assert Reservation.objects.filter(pk=reservation.pk).exists() is False

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is True
    assert SentryLogger.log_message.call_count == 1


def test_reservation__delete__confirmed__cannot_delete_when_status_not_created_nor_waiting_for_payment(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.CONFIRMED)

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, variables={"input": data})

    assert response.error_message(0) == (
        "Reservation which is not in 'CREATED' or 'WAITING_FOR_PAYMENT' state cannot be deleted."
    )
    assert Reservation.objects.filter(pk=reservation.pk).exists() is True


@patch_method(VerkkokauppaAPIClient.get_payment, PaymentFactory.create(status=WebShopPaymentStatus.PAID_ONLINE.value))
@patch_method(VerkkokauppaAPIClient.cancel_order)
@patch_method(EmailService.send_reservation_confirmed_email)
def test_reservation__delete__reservation_is_in_draft_state_but_paid_in_verkkokauppa(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, variables={"input": data})

    assert response.error_message(0) == "Reservation which is paid cannot be deleted."
    assert Reservation.objects.filter(pk=reservation.pk).exists() is True

    assert VerkkokauppaAPIClient.get_payment.called is True
    assert VerkkokauppaAPIClient.cancel_order.called is False
    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED
    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID

    assert EmailService.send_reservation_confirmed_email.called is True


@override_settings(MOCK_VERKKOKAUPPA_API_ENABLED=True)
def test_reservation__delete__mock_verkkokauppa(graphql):
    reservation = ReservationFactory.create_for_delete(state=ReservationStateChoice.WAITING_FOR_PAYMENT)
    payment_order = PaymentOrderFactory.create(
        remote_id=uuid.uuid4(), reservation=reservation, status=OrderStatus.DRAFT
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, variables={"input": data})

    payment_order.refresh_from_db()

    assert response.has_errors is False
    assert payment_order.processed_at is not None
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(PindoraService.delete_access_code)
def test_reservation__delete__delete_from_pindora__call_succeeds(graphql):
    reservation = ReservationFactory.create_for_delete(
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        access_type=AccessType.ACCESS_CODE,
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)
    response = graphql(DELETE_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.delete_access_code.called is True


@patch_method(PindoraService.delete_access_code, side_effect=PindoraAPIError())
def test_reservation__delete__delete_from_pindora__call_fails_runs_task(graphql):
    reservation = ReservationFactory.create_for_delete(
        state=ReservationStateChoice.WAITING_FOR_PAYMENT,
        access_type=AccessType.ACCESS_CODE,
    )

    graphql.login_with_superuser()
    data = get_delete_data(reservation)

    path = "tilavarauspalvelu.api.graphql.types.reservation.mutations.delete_reservation."
    path += delete_pindora_reservation_task.__name__
    path += ".delay"

    with patch(path) as task:
        response = graphql(DELETE_MUTATION, variables={"input": data})

    assert response.has_errors is False, response.errors

    assert PindoraService.delete_access_code.called is True
    assert task.called is True
