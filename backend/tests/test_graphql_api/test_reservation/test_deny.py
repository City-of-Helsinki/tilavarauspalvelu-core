from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import pytest
from django.test import override_settings

from tilavarauspalvelu.enums import AccessType, OrderStatus, PaymentType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraAPIError, PindoraNotFoundError
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import WebShopPaymentStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.date_utils import local_datetime

from tests.factories import PaymentFactory, ReservationFactory
from tests.helpers import patch_method

from .helpers import DENY_MUTATION, get_deny_data

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(EmailService.send_reservation_denied_email)
@pytest.mark.parametrize("reservation_type", [ReservationTypeChoice.NORMAL, ReservationTypeChoice.SEASONAL])
def test_reservation__deny__state_is_confirmed(graphql, reservation_type):
    reservation = ReservationFactory.create_for_deny(state=ReservationStateChoice.CONFIRMED, type=reservation_type)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert EmailService.send_reservation_denied_email.called is True


def test_reservation__deny__status_not_allowed_states(graphql):
    reservation = ReservationFactory.create_for_deny(state=ReservationStateChoice.CREATED)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation cannot be denied based on its state",
    ]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CREATED


def test_reservation__deny__reason_missing(graphql):
    reservation = ReservationFactory.create_for_deny()

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    input_data.pop("denyReason")
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_schema_errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__deny__handling_details_missing(graphql):
    reservation = ReservationFactory.create_for_deny()

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    input_data.pop("handlingDetails")
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_schema_errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


def test_reservation__deny__state_confirmed_and_reservation_ended(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    end = last_hour - datetime.timedelta(hours=1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(state=ReservationStateChoice.CONFIRMED, begin=begin, end=end)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Reservation cannot be denied after it has ended.",
    ]

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.CONFIRMED


def test_reservation__deny__state_requires_handling_and_reservation_ended(graphql):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    end = last_hour - datetime.timedelta(hours=1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(begin=begin, end=end)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


@override_settings(SEND_EMAILS=True)
def test_reservation__deny__send_email(graphql, outbox):
    reservation = ReservationFactory.create_for_deny()

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED
    assert reservation.handling_details == "foo"
    assert reservation.handled_at is not None

    assert len(outbox) == 1
    assert outbox[0].subject == "Unfortunately your booking cannot be confirmed"


@override_settings(SEND_EMAILS=True)
@pytest.mark.parametrize(
    "reservation_type",
    [
        ReservationTypeChoice.STAFF,
        ReservationTypeChoice.BLOCKED,
        ReservationTypeChoice.BEHALF,
    ],
)
def test_reservation__deny__dont_send_email_for_reservation_type_x(graphql, outbox, reservation_type):
    reservation = ReservationFactory.create_for_deny(type=reservation_type)

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 0


@override_settings(SEND_EMAILS=True)
def test_reservation__deny__send_email_if_reservation_started_but_not_ended(graphql, outbox):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    begin = last_hour - datetime.timedelta(hours=1)
    end = last_hour + datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(begin=begin, end=end)

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 1
    assert outbox[0].subject == "Unfortunately your booking cannot be confirmed"


@override_settings(SEND_EMAILS=True)
def test_reservation__deny__dont_send_notification_if_reservation_already_ended(graphql, outbox):
    now = local_datetime()
    last_hour = now.replace(minute=0, second=0, microsecond=0)
    end = last_hour - datetime.timedelta(hours=1)
    begin = end - datetime.timedelta(hours=1)

    reservation = ReservationFactory.create_for_deny(begin=begin, end=end)

    graphql.login_with_superuser()
    data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    assert len(outbox) == 0


@patch_method(PindoraService.delete_access_code)
def test_reservation__deny__delete_from_pindora__call_success(graphql):
    reservation = ReservationFactory.create_for_deny(
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    assert PindoraService.delete_access_code.called is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


@patch_method(PindoraService.delete_access_code, side_effect=PindoraAPIError("Pindora Error"))
def test_reservation__deny__delete_from_pindora__call_fails(graphql):
    reservation = ReservationFactory.create_for_deny(
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == ["Pindora Error"]

    assert PindoraService.delete_access_code.called is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.REQUIRES_HANDLING


@patch_method(PindoraService.delete_access_code, side_effect=PindoraNotFoundError("Error"))
def test_reservation__deny__delete_from_pindora__call_fails__404(graphql):
    reservation = ReservationFactory.create_for_deny(
        access_type=AccessType.ACCESS_CODE,
        access_code_is_active=True,
        access_code_generated_at=local_datetime(),
    )

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    # Request is still successful if Pindora fails with 404
    assert response.has_errors is False, response.errors

    assert PindoraService.delete_access_code.called is True

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


@patch_method(VerkkokauppaAPIClient.get_payment)
def test_reservation__deny__has_order__status_unchanged_after_webshop_refresh(graphql):
    reservation = ReservationFactory.create_for_deny(
        payment_order__remote_id=uuid.uuid4(),
        payment_order__status=OrderStatus.PAID,
        payment_order__payment_type=PaymentType.ONLINE,
        payment_order__price_net=Decimal("10.0"),
        payment_order__price_vat=Decimal("2.4"),
        payment_order__price_total=Decimal("12.4"),
    )

    payment = PaymentFactory.create(status=WebShopPaymentStatus.PAID_ONLINE)
    VerkkokauppaAPIClient.get_payment.return_value = payment

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


@patch_method(VerkkokauppaAPIClient.get_payment)
def test_reservation__deny__has_order__status_changed_after_webshop_refresh(graphql):
    reservation = ReservationFactory.create_for_deny(
        payment_order__remote_id=uuid.uuid4(),
        payment_order__status=OrderStatus.PENDING,
        payment_order__handled_payment_due_by=local_datetime(),
        payment_order__payment_type=PaymentType.ONLINE,
        payment_order__price_net=Decimal("10.0"),
        payment_order__price_vat=Decimal("2.4"),
        payment_order__price_total=Decimal("12.4"),
    )
    payment_order = reservation.payment_order

    payment = PaymentFactory.create(status=WebShopPaymentStatus.PAID_ONLINE)
    VerkkokauppaAPIClient.get_payment.return_value = payment

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.error_message() == "Mutation was unsuccessful."
    assert response.field_error_messages() == [
        "Payment order status has changed to paid. Must re-evaluate if reservation should be denied.",
    ]

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID


@patch_method(VerkkokauppaAPIClient.get_payment)
def test_reservation__deny__has_order__deny_successful_if_webshop_unresponsive(graphql):
    reservation = ReservationFactory.create_for_deny(
        payment_order__remote_id=uuid.uuid4(),
        payment_order__status=OrderStatus.PENDING,
        payment_order__handled_payment_due_by=local_datetime(),
        payment_order__payment_type=PaymentType.ONLINE,
        payment_order__price_net=Decimal("10.0"),
        payment_order__price_vat=Decimal("2.4"),
        payment_order__price_total=Decimal("12.4"),
    )

    VerkkokauppaAPIClient.get_payment.side_effect = GetPaymentError("Mock error")

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED


def test_reservation__deny__has_order__unpaid_payment_cancelled(graphql):
    reservation = ReservationFactory.create_for_deny(
        payment_order__remote_id=None,
        payment_order__status=OrderStatus.PENDING,
        payment_order__handled_payment_due_by=local_datetime(),
        payment_order__payment_type=PaymentType.ONLINE,
        payment_order__price_net=Decimal("10.0"),
        payment_order__price_vat=Decimal("2.4"),
        payment_order__price_total=Decimal("12.4"),
    )
    payment_order = reservation.payment_order

    graphql.login_with_superuser()
    input_data = get_deny_data(reservation)
    response = graphql(DENY_MUTATION, input_data=input_data)

    assert response.has_errors is False, response.errors

    reservation.refresh_from_db()
    assert reservation.state == ReservationStateChoice.DENIED

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED
