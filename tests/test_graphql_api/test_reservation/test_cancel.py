from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from unittest import mock

import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import OrderStatus, PaymentType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.models import ReservationCancelReason
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime

from tests.factories import PaymentOrderFactory, ReservationFactory
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

    reasons = list(ReservationCancelReason.objects.all())
    assert len(reasons) == 1

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CANCELLED
    assert reservation.cancel_reason == reasons[0]

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
    assert response.field_error_messages() == ["Only reservations with type ['NORMAL', 'SEASONAL'] can be cancelled."]


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
    assert response.field_error_messages() == [
        "Only reservations with state 'CONFIRMED' can be cancelled.",
    ]

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
        "Reservation cannot be cancelled because the cancellation period is over.",
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
    assert response.field_error_messages() == [
        "Reservation cannot be cancelled after it has begun.",
    ]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__cancel__fails_if_no_cancellation_rule(graphql):
    reservation = ReservationFactory.create_for_cancellation(reservation_units__cancellation_rule=None)

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation cannot be cancelled because its reservation unit has no cancellation rule.",
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
def test_reservation__cancel__starts_refund_process_for_paid_reservation(graphql):
    reservation = ReservationFactory.create_for_cancellation(price=1)

    remote_id = uuid.uuid4()
    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=remote_id,
        refund_id=None,
        payment_type=PaymentType.ONLINE,
        status=OrderStatus.PAID,
        price_net=Decimal("100.00"),
        price_vat=Decimal("24.00"),
        price_total=Decimal("124.00"),
    )

    refund_id = uuid.uuid4()
    mock_refund = mock.MagicMock()
    mock_refund.refund_id = refund_id

    VerkkokauppaAPIClient.refund_order.return_value = mock_refund

    graphql.login_with_superuser()
    data = get_cancel_data(reservation)
    response = graphql(CANCEL_MUTATION, input_data=data)

    assert response.has_errors is False

    VerkkokauppaAPIClient.refund_order.assert_called_with(order_uuid=remote_id)

    payment_order.refresh_from_db()
    assert payment_order.refund_id == refund_id
