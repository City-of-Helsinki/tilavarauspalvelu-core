from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime

from tests.factories import ReservationFactory, UserFactory
from tests.helpers import patch_method

from .helpers import REFUND_MUTATION, get_refund_data

pytestmark = [
    pytest.mark.django_db,
]


REFUND = MagicMock(refund_id=uuid.uuid4())


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__general_admin(graphql):
    reservation = ReservationFactory.create_for_refund()
    payment_order = reservation.payment_order.first()

    admin = UserFactory.create_with_general_role()
    graphql.force_login(admin)

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    VerkkokauppaAPIClient.refund_order.assert_called_with(order_uuid=payment_order.remote_id)
    payment_order.refresh_from_db()
    assert payment_order.refund_id == REFUND.refund_id


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__regular_user(graphql):
    reservation = ReservationFactory.create_for_refund()
    payment_order = reservation.payment_order.first()

    graphql.login_with_regular_user()

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.error_message() == "No permission to update."

    assert VerkkokauppaAPIClient.refund_order.called is False
    payment_order.refresh_from_db()
    assert payment_order.refund_id is None


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__invalid_state__ends_in_the_future(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour - datetime.timedelta(hours=1)
    end = last_hour + datetime.timedelta(hours=2)

    reservation = ReservationFactory.create_for_refund(state=ReservationStateChoice.CONFIRMED, begin=begin, end=end)
    payment_order = reservation.payment_order.first()

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be refunded based on its state"]

    assert VerkkokauppaAPIClient.refund_order.called is False
    payment_order.refresh_from_db()
    assert payment_order.refund_id is None


@freeze_time("2022-01-01 12:00:00")
@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__correct_state__ends_in_the_future(graphql):
    """
    Reservations that end in the future can be refunded.
    This was previously not allowed, but the restriction was removed in TILA-3881.
    This test is kept as a regression test.
    """
    now = local_datetime()

    reservation = ReservationFactory.create_for_refund(
        state=ReservationStateChoice.CANCELLED,
        begin=now - datetime.timedelta(hours=1),
        end=now + datetime.timedelta(hours=2),
    )
    payment_order = reservation.payment_order.first()

    graphql.login_with_superuser()

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    VerkkokauppaAPIClient.refund_order.assert_called_with(order_uuid=payment_order.remote_id)
    payment_order.refresh_from_db()
    assert payment_order.refund_id == REFUND.refund_id


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__invalid_state__ends_in_the_past(graphql):
    reservation = ReservationFactory.create_for_refund(state=ReservationStateChoice.CONFIRMED)
    payment_order = reservation.payment_order.first()

    graphql.login_with_superuser()

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Reservation cannot be refunded based on its state"]

    assert VerkkokauppaAPIClient.refund_order.called is False
    payment_order.refresh_from_db()
    assert payment_order.refund_id is None


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__payment_order_is_missing(graphql):
    reservation = ReservationFactory.create_for_refund(state=ReservationStateChoice.CANCELLED)
    reservation.payment_order.first().delete()

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Only reservations with a paid order can be refunded."]

    assert VerkkokauppaAPIClient.refund_order.called is False


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__payment_order_is_not_paid(graphql):
    reservation = ReservationFactory.create_for_refund(
        state=ReservationStateChoice.CANCELLED,
        payment_order__status=OrderStatus.DRAFT,
    )
    payment_order = reservation.payment_order.first()

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Only reservations with a paid order can be refunded."]

    assert VerkkokauppaAPIClient.refund_order.called is False
    payment_order.refresh_from_db()
    assert payment_order.refund_id is None


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__payment_order_is_waiting_for_refund(graphql):
    refund_id = uuid.uuid4()

    reservation = ReservationFactory.create_for_refund(
        state=ReservationStateChoice.CANCELLED,
        payment_order__refund_id=refund_id,
    )
    payment_order = reservation.payment_order.first()

    graphql.login_with_superuser()
    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Only reservations with a paid order can be refunded."]

    assert VerkkokauppaAPIClient.refund_order.called is False
    assert payment_order.refund_id == refund_id


@patch_method(VerkkokauppaAPIClient.refund_order, return_value=REFUND)
def test_reservation__refund__reservation_price_is_zero(graphql):
    reservation = ReservationFactory.create_for_refund(
        state=ReservationStateChoice.CANCELLED,
        price=Decimal(0),
    )
    payment_order = reservation.payment_order.first()

    graphql.login_with_superuser()

    input_data = get_refund_data(reservation)
    response = graphql(REFUND_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Only paid reservations can be refunded."]

    payment_order.refresh_from_db()
    assert payment_order.refund_id is None
