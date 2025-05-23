from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import (
    AccessType,
    OrderStatus,
    PaymentType,
    ReservationCancelReasonChoice,
    ReservationStateChoice,
    ReservationTypeChoice,
)
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.integrations.verkkokauppa.order.types import WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime

from tests.factories import OrderFactory, PaymentOrderFactory, RefundFactory, ReservationFactory
from tests.helpers import patch_method

from .helpers import CANCEL_MUTATION, get_cancel_data

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_reservation_cancelled_email)
@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.NORMAL, ReservationTypeChoice.SEASONAL])
def test_reservation__cancel__success(graphql, reservation_type):
    reservation = ReservationFactory.create_for_cancellation(type=reservation_type)

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED
    assert reservation.cancel_reason == ReservationCancelReasonChoice.CHANGE_OF_PLANS

    assert EmailService.send_reservation_cancelled_email.called is True


def test_reservation__cancel__adds_cancel_details(graphql):
    reservation = ReservationFactory.create_for_cancellation()

    graphql.login_with_superuser()
    data = get_cancel_data(reservation, cancelDetails="foo")
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.cancel_details == "foo"


@pytest.mark.parametrize(
    "reservation_type",
    [
        ReservationTypeChoice.BLOCKED,
        ReservationTypeChoice.STAFF,
        ReservationTypeChoice.BEHALF,
    ],
)
def test_reservation__cancel__fails_type_wrong(graphql, reservation_type):
    reservation = ReservationFactory.create_for_cancellation(type=reservation_type)

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be cancelled based on its type"]


def test_reservation__cancel__fails_when_type_is_seasonal_and_reservation_is_paid(graphql):
    reservation = ReservationFactory.create_for_cancellation(type=ReservationTypeChoice.SEASONAL, price=10)

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Paid seasonal reservations cannot be cancelled."]


def test_reservation__cancel__fails_if_state_is_not_confirmed(graphql):
    reservation = ReservationFactory.create_for_cancellation(state=ReservationStateChoice.CREATED)

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be cancelled based on its state"]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__cancel__fails_if_cancel_reason_not_given(graphql):
    reservation = ReservationFactory.create_for_cancellation()

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    data.pop("cancelReason")
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__cancel__regular_user_can_cancel_own_reservation(graphql):
    reservation = ReservationFactory.create_for_cancellation()

    graphql.force_login(reservation.user)
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED


def test_reservation__cancel__regular_user_cannot_cancel_other_users_reservation(graphql):
    reservation = ReservationFactory.create_for_cancellation()

    graphql.login_with_regular_user()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "No permission to update."

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__cancel__fails_when_cancellation_time_is_over(graphql):
    reservation = ReservationFactory.create_for_cancellation(
        reservation_units__cancellation_rule__can_be_cancelled_time_before=datetime.timedelta(hours=12),
    )

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation time cannot be changed because the cancellation period has expired.",
    ]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__cancel__fails_when_reservation_in_the_past(graphql):
    now = local_datetime()
    reservation = ReservationFactory.create_for_cancellation(
        begin=now - datetime.timedelta(hours=2),
        end=now - datetime.timedelta(hours=1),
    )

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Past or ongoing reservations cannot be modified"]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__cancel__fails_if_no_cancellation_rule(graphql):
    reservation = ReservationFactory.create_for_cancellation(reservation_units__cancellation_rule=None)

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation cannot be changed because it has no cancellation rule.",
    ]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


@override_settings(SEND_EMAILS=True)
def test_reservation__cancel__sends_email_notification(graphql, outbox):
    reservation = ReservationFactory.create_for_cancellation()

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED

    assert len(outbox) == 1
    assert outbox[0].subject == "Your booking has been cancelled"


@patch_method(VerkkokauppaAPIClient.refund_order)
def test_reservation__cancel__refund_for_paid_reservation(graphql):
    reservation = ReservationFactory.create_for_cancellation(price=1)

    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        payment_type=PaymentType.ONLINE,
        status=OrderStatus.PAID,
        price_net=Decimal("100.00"),
        price_vat=Decimal("24.00"),
        price_total=Decimal("124.00"),
    )

    refund = RefundFactory.create()
    VerkkokauppaAPIClient.refund_order.return_value = refund

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    VerkkokauppaAPIClient.refund_order.assert_called_with(order_uuid=payment_order.remote_id)

    payment_order.refresh_from_db()
    assert payment_order.refund_id == refund.refund_id

    # Status will change when refund webhook is received
    assert payment_order.status == OrderStatus.PAID


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__cancel__cancel_invoiced_reservation(graphql):
    reservation = ReservationFactory.create_for_cancellation(price=1)

    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        refund_id=None,
        payment_type=PaymentType.ONLINE_OR_INVOICE,
        status=OrderStatus.PAID_BY_INVOICE,
        price_net=Decimal("100.00"),
        price_vat=Decimal("24.00"),
        price_total=Decimal("124.00"),
        reservation_user_uuid=uuid.uuid4(),
    )

    order = OrderFactory.create(status=WebShopOrderStatus.CANCELLED)
    VerkkokauppaAPIClient.cancel_order.return_value = order

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    VerkkokauppaAPIClient.cancel_order.assert_called_with(
        order_uuid=payment_order.remote_id,
        user_uuid=payment_order.reservation_user_uuid,
    )

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


def test_reservation__cancel__cancel_unpaid_reservation(graphql):
    reservation = ReservationFactory.create_for_cancellation(price=1)

    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=None,
        refund_id=None,
        payment_type=PaymentType.ONLINE,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(),
        price_net=Decimal("100.00"),
        price_vat=Decimal("24.00"),
        price_total=Decimal("124.00"),
    )

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__cancel__cancel_unpaid_reservation__also_cancel_verkkokauppa_order(graphql):
    reservation = ReservationFactory.create_for_cancellation(price=1)

    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        refund_id=None,
        payment_type=PaymentType.ONLINE,
        status=OrderStatus.PENDING,
        handled_payment_due_by=local_datetime(),
        price_net=Decimal("100.00"),
        price_vat=Decimal("24.00"),
        price_total=Decimal("124.00"),
    )

    order = OrderFactory.create(status=WebShopOrderStatus.CANCELLED)
    VerkkokauppaAPIClient.cancel_order.return_value = order

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    VerkkokauppaAPIClient.cancel_order.assert_called_with(
        order_uuid=payment_order.remote_id,
        user_uuid=payment_order.reservation_user_uuid,
    )

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(PindoraService.delete_access_code)
def test_reservation__cancel__delete_from_pindora__call_success(graphql):
    reservation = ReservationFactory.create_for_cancellation(
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    assert PindoraService.delete_access_code.called is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED


@patch_method(PindoraService.delete_access_code, side_effect=PindoraAPIError("Pindora API error"))
def test_reservation__cancel__delete_from_pindora__call_fails(graphql):
    reservation = ReservationFactory.create_for_cancellation(
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Pindora API error"]

    assert PindoraService.delete_access_code.called is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


@patch_method(PindoraService.delete_access_code, side_effect=PindoraNotFoundError("Error"))
def test_reservation__cancel__delete_from_pindora__call_fails__404(graphql):
    reservation = ReservationFactory.create_for_cancellation(
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    # Request is still successful if Pindora fails with 404
    assert response.has_errors is False, response.errors

    assert PindoraService.delete_access_code.called is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED
    assert reservation.access_code_generated_at is not None
    assert reservation.access_code_is_active is True
