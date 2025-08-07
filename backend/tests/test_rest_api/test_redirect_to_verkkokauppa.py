from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import pytest
from django.urls import reverse
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import OrderStatus, PaymentType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.models.reservation.actions import ReservationActions
from utils.date_utils import next_hour
from utils.utils import get_query_params, update_query_params

from tests.factories import OrderFactory, ReservationFactory, ReservationUnitFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.django_db,
]


@patch_method(VerkkokauppaAPIClient.create_order)
def test_redirect_to_verkkokauppa__success(api_client):
    order = OrderFactory.create()
    VerkkokauppaAPIClient.create_order.return_value = order

    reservation = ReservationFactory.create_with_pending_payment()

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    assert response.status_code == 302
    assert response.url == "https://checkout.url/paymentmethod"

    # Tax percentage value should be updated
    reservation.refresh_from_db()
    assert reservation.tax_percentage_value == Decimal("25.5")


def test_redirect_to_verkkokauppa__no_redirect_on_error(api_client):
    reservation = ReservationFactory.create_with_pending_payment()

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    assert response.status_code == 400
    assert response.json() == {
        "detail": "Request should include a 'redirect_on_error' parameter for error handling.",
        "code": "REDIRECT_ON_ERROR_MISSING",
    }


def test_redirect_to_verkkokauppa__redirect_on_error_not_url(api_client):
    reservation = ReservationFactory.create_with_pending_payment()

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="foo")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    assert response.status_code == 400
    assert response.json() == {
        "detail": "The 'redirect_on_error' parameter should be a valid URL.",
        "code": "REDIRECT_ON_ERROR_INVALID",
    }


@patch_method(VerkkokauppaAPIClient.create_order)
def test_redirect_to_verkkokauppa__redirect_on_error_from_referer(api_client):
    order = OrderFactory.create()
    VerkkokauppaAPIClient.create_order.return_value = order

    reservation = ReservationFactory.create_with_pending_payment()

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})

    api_client.force_login(reservation.user)
    response = api_client.get(url, headers={"Referer": "https://fake.varaamo.hel.fi"})

    assert response.status_code == 302
    assert response.url == "https://checkout.url/paymentmethod"


def test_redirect_to_verkkokauppa__reservation_not_found(api_client):
    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": 0})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Reservation not found",
        "error_code": "RESERVATION_NOT_FOUND",
    }


def test_redirect_to_verkkokauppa__reservation_user_not_request_user(api_client):
    reservation = ReservationFactory.create_with_pending_payment()

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Reservation is not owned by the requesting user",
        "error_code": "RESERVATION_NOT_OWNED_BY_USER",
    }


def test_redirect_to_verkkokauppa__reservation_not_confirmed(api_client):
    reservation = ReservationFactory.create_with_pending_payment(
        state=ReservationStateChoice.REQUIRES_HANDLING,
    )

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Reservation is not confirmed",
        "error_code": "RESERVATION_NOT_CONFIRMED",
    }


def test_redirect_to_verkkokauppa__reservation_no_payment_order(api_client):
    begin = next_hour(plus_hours=1)

    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(
        state=ReservationStateChoice.CONFIRMED,
        type=ReservationTypeChoice.NORMAL,
        begins_at=begin,
        ends_at=begin + datetime.timedelta(hours=1),
        reservation_unit=reservation_unit,
        payment_order=None,
    )

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Reservation does not have a payment order",
        "error_code": "RESERVATION_NO_PAYMENT_ORDER",
    }


def test_redirect_to_verkkokauppa__reservation_payment_not_in_verkkokauppa(api_client):
    reservation = ReservationFactory.create_with_pending_payment(
        payment_order__payment_type=PaymentType.ON_SITE,
    )

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Reservation does not require verkkokauppa payment",
        "error_code": "RESERVATION_NO_VERKKOKAUPPA_PAYMENT",
    }


def test_redirect_to_verkkokauppa__reservation_payment_not_pending(api_client):
    reservation = ReservationFactory.create_with_pending_payment(
        payment_order__status=OrderStatus.PAID,
    )

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Payment for reservation is not in status 'PENDING'",
        "error_code": "RESERVATION_PAYMENT_ORDER_NOT_PENDING",
    }


def test_redirect_to_verkkokauppa__reservation_handled_payment_due_by_in_past(api_client):
    reservation = ReservationFactory.create_with_pending_payment(
        payment_order__handled_payment_due_by=next_hour(plus_hours=-2),
    )

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Reservation can no longer be paid since its due by date has passed",
        "error_code": "RESERVATION_PAYMENT_ORDER_PAST_DUE_BY",
    }


def test_redirect_to_verkkokauppa__reservation_already_has_verkkokauppa_order(api_client):
    reservation = ReservationFactory.create_with_pending_payment(
        payment_order__remote_id=uuid.uuid4(),
        payment_order__checkout_url="https://fake.varaamo.hel.fi/checkout",
        payment_order__receipt_url="https://fake.varaamo.hel.fi/receipt",
    )

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    assert response.status_code == 302
    assert response.url == "https://fake.varaamo.hel.fi/checkout/paymentmethod"


@patch_method(VerkkokauppaAPIClient.create_order)
def test_redirect_to_verkkokauppa__reservation_already_has_verkkokauppa_order__expired(api_client):
    order = OrderFactory.create()
    VerkkokauppaAPIClient.create_order.return_value = order

    reservation = ReservationFactory.create_with_pending_payment(
        payment_order__remote_id=uuid.uuid4(),
        payment_order__checkout_url="https://fake.verkkokauppa.hel.fi/checkout",
        payment_order__receipt_url="https://fake.verkkokauppa.hel.fi/receipt",
    )

    reservation.payment_order.created_at = next_hour(plus_hours=-2)
    reservation.payment_order.save()

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    # Current order was not valid, so a new order was created
    assert response.status_code == 302
    assert response.url == "https://checkout.url/paymentmethod"


def test_redirect_to_verkkokauppa__reservation_unit_has_no_active_pricing(api_client):
    reservation = ReservationFactory.create_with_pending_payment()
    reservation.reservation_unit.pricings.all().delete()

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Reservation unit has no active pricing information",
        "error_code": "RESERVATION_UNIT_NO_ACTIVE_PRICING",
    }


@patch_method(ReservationActions.create_order_in_verkkokauppa, side_effect=ValidationError("Error"))
def test_redirect_to_verkkokauppa__verkkokauppa_order_creation_failed(api_client):
    reservation = ReservationFactory.create_with_pending_payment()

    url = reverse("verkkokauppa_pending_reservation", kwargs={"pk": reservation.pk})
    url = update_query_params(url, redirect_on_error="https://fake.varaamo.hel.fi")

    api_client.force_login(reservation.user)
    response = api_client.get(url)

    query_params = get_query_params(response.url)

    assert response.status_code == 302
    assert query_params == {
        "error_message": "Payment for reservation could not be created in verkkokauppa",
        "error_code": "RESERVATION_PAYMENT_CREATION_FAILED",
    }
