from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.verkkokauppa.order.types import WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime

from tests.factories import OrderFactory, RefundFactory, ReservationFactory, UserFactory
from tests.helpers import patch_method

from .helpers import REFUND_MUTATION, get_refund_data

pytestmark = [
    pytest.mark.django_db,
]


REFUND = RefundFactory.create()


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__general_admin(graphql):
    reservation = ReservationFactory.create_for_refund()
    payment_order = reservation.payment_order

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response.errors

    VerkkokauppaAPIClient.refund_order.assert_called_with(order_uuid=payment_order.remote_id)
    payment_order.refresh_from_db()
    assert payment_order.refund_id == REFUND.refund_id


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__regular_user(graphql):
    reservation = ReservationFactory.create_for_refund()
    payment_order = reservation.payment_order

    graphql.login_with_regular_user()

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "No permission to refund this reservation."

    assert VerkkokauppaAPIClient.refund_order.called is False
    payment_order.refresh_from_db()
    assert payment_order.refund_id is None


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__correct_state(graphql):
    reservation = ReservationFactory.create_for_refund()
    payment_order = reservation.payment_order

    graphql.login_with_superuser()

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response.errors

    VerkkokauppaAPIClient.refund_order.assert_called_with(order_uuid=payment_order.remote_id)

    payment_order.refresh_from_db()
    assert payment_order.refund_id == REFUND.refund_id

    # Status will change when refund webhook is received
    assert payment_order.status == OrderStatus.PAID


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__invalid_state(graphql):
    reservation = ReservationFactory.create_for_refund(state=ReservationStateChoice.CONFIRMED)

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "Reservation cannot be refunded based on its state"

    assert VerkkokauppaAPIClient.refund_order.called is False


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__reservation_price_is_zero(graphql):
    reservation = ReservationFactory.create_for_refund(price=Decimal(0))
    payment_order = reservation.payment_order

    graphql.login_with_superuser()

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "Only paid reservations can be refunded."

    payment_order.refresh_from_db()
    assert payment_order.refund_id is None


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__payment_order_is_missing(graphql):
    reservation = ReservationFactory.create_for_refund()
    reservation.payment_order.delete()

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "Reservation doesn't have an order."

    assert VerkkokauppaAPIClient.refund_order.called is False


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__payment_order_is_waiting_for_refund(graphql):
    reservation = ReservationFactory.create_for_refund(
        payment_order__refund_id=uuid.uuid4(),
    )

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "Order has already been refunded."

    assert VerkkokauppaAPIClient.refund_order.called is False


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_reservation__refund__invoiced__cancel_if_paid_by_invoice(graphql):
    reservation = ReservationFactory.create_for_refund(
        payment_order__status=OrderStatus.PAID_BY_INVOICE,
    )
    payment_order = reservation.payment_order

    order = OrderFactory.create(status=WebShopOrderStatus.CANCELLED)
    VerkkokauppaAPIClient.cancel_order.return_value = order

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.has_errors is False, response.errors

    VerkkokauppaAPIClient.cancel_order.assert_called_with(
        order_uuid=payment_order.remote_id,
        user_uuid=payment_order.reservation_user_uuid,
    )

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(VerkkokauppaAPIClient.cancel_order)
@freeze_time(local_datetime(2021, 1, 2, hour=12))
def test_reservation__refund__invoiced__date_in_the_past(graphql):
    begin = local_datetime(2021, 1, 1, hour=12)

    reservation = ReservationFactory.create_for_refund(
        payment_order__status=OrderStatus.PAID_BY_INVOICE,
        begins_at=begin,
        ends_at=begin + datetime.timedelta(hours=1),
    )

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, variables={"input": input_data})

    assert response.error_message(0) == "Order cannot be cancelled after its reservation start date."

    assert VerkkokauppaAPIClient.cancel_order.called is False
