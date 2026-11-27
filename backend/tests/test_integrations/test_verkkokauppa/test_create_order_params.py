from __future__ import annotations

import datetime
from decimal import Decimal

import freezegun
import pytest
from django.conf import settings

from tilavarauspalvelu.enums import ReserveeType
from tilavarauspalvelu.integrations.verkkokauppa.helpers import get_verkkokauppa_order_params
from utils.date_utils import local_datetime

from tests.factories import (
    PaymentProductFactory,
    ReservationFactory,
    ReservationPriceLineFactory,
    ReservationUnitFactory,
    UserFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2023-01-01 00:00:00")
def test_get_verkkokauppa_order_params__to_json():
    payment_product = PaymentProductFactory.create()
    reservation_unit = ReservationUnitFactory.create()
    user = UserFactory.create(
        username="test",
        email="test@localhost",
        first_name="First",
        last_name="Last",
        preferred_language="fi",
    )
    reservation = ReservationFactory.create(
        reservation_unit=reservation_unit,
        user=user,
        price_lines__amount=Decimal("12.55"),
        price_lines__tax_percentage=Decimal("24.0"),
        price_lines__payment_product=payment_product,
        reservee_type=ReserveeType.INDIVIDUAL,
        reservee_first_name="Firstname",
        reservee_last_name="Lastname",
        reservee_email="test@example.com",
        reservee_phone="+358 50 123 4567",
    )

    order_params = get_verkkokauppa_order_params(reservation)
    json = order_params.to_json()

    assert json["namespace"] == settings.VERKKOKAUPPA_NAMESPACE
    assert json["user"] == str(reservation.user.uuid)
    assert json["language"] == reservation.user.get_preferred_language()
    assert json["priceNet"] == "10.12"
    assert json["priceVat"] == "2.43"
    assert json["priceTotal"] == "12.55"
    assert json["customer"]["firstName"] == "First"
    assert json["customer"]["lastName"] == "Last"
    assert json["customer"]["email"] == "test@localhost"
    assert json["customer"]["phone"] == ""
    assert json["lastValidPurchaseDateTime"] == (
        local_datetime() + datetime.timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
    ).strftime("%Y-%m-%dT%H:%M:%S")

    assert len(json["items"]) == 1
    assert json["items"][0]["productId"] == str(payment_product.id)
    assert (
        json["items"][0]["productName"]
        == f"{reservation.reservation_unit.name_fi}, {reservation.reservation_unit.unit.name_fi}"
    )
    assert json["items"][0]["quantity"] == 1
    assert json["items"][0]["unit"] == "pcs"
    assert json["items"][0]["rowPriceNet"] == "10.12"
    assert json["items"][0]["rowPriceVat"] == "2.43"
    assert json["items"][0]["rowPriceTotal"] == "12.55"
    assert json["items"][0]["priceNet"] == "10.12"
    assert json["items"][0]["priceVat"] == "2.43"
    assert json["items"][0]["priceGross"] == "12.55"
    assert json["items"][0]["vatPercentage"] == "24.0"
    assert len(json["items"][0]["meta"]) == 3
    assert json["items"][0]["meta"][0]["key"] == "namespaceProductId"
    assert json["items"][0]["meta"][0]["value"] == str(reservation.reservation_unit.ext_uuid)
    assert json["items"][0]["meta"][0]["label"] is None
    assert json["items"][0]["meta"][0]["visibleInCheckout"] is False
    assert json["items"][0]["meta"][0]["ordinal"] == "0"
    assert json["items"][0]["meta"][1]["key"] == "reservationPeriod"
    assert json["items"][0]["meta"][1]["label"] == "Varausaika"
    assert json["items"][0]["meta"][2]["key"] == "reservationNumber"
    assert json["items"][0]["meta"][2]["label"] == "Varausnumero"
    assert json["items"][0]["meta"][2]["value"] == str(reservation.pk)


@freezegun.freeze_time("2023-01-01 00:00:00")
def test_get_verkkokauppa_order_params__to_json__meta_label_language_support():
    reservation = ReservationFactory.create(
        user__preferred_language="en",
        price_lines__amount=Decimal("12.55"),
        price_lines__tax_percentage=Decimal("24.0"),
        price_lines__payment_product=PaymentProductFactory.create(),
        reservee_type=ReserveeType.INDIVIDUAL,
    )

    order_params = get_verkkokauppa_order_params(reservation)
    json = order_params.to_json()

    assert len(json["items"][0]["meta"]) == 3
    assert json["items"][0]["meta"][1]["label"] == "Booking time"
    assert json["items"][0]["meta"][2]["label"] == "Booking number"


# ── Order rows ───────────────────────────────────────────────────────────────────────────────────────────────────────


def test_get_verkkokauppa_order_params__row_for_each_price_line():
    first_product = PaymentProductFactory.create()
    second_product = PaymentProductFactory.create()
    reservation = ReservationFactory.create(
        user__preferred_language="fi",
        reservation_unit__name_fi="Sali",
        reservation_unit__unit__name_fi="Talo",
    )
    ReservationPriceLineFactory.create(
        reservation=reservation,
        amount=Decimal("12.55"),
        tax_percentage=Decimal("25.5"),
        payment_product=first_product,
        description_fi="Aikuiset",
    )
    ReservationPriceLineFactory.create(
        reservation=reservation,
        amount=Decimal("10.00"),
        tax_percentage=Decimal("10.0"),
        payment_product=second_product,
    )

    order_params = get_verkkokauppa_order_params(reservation)

    assert [item.product_id for item in order_params.items] == [first_product.pk, second_product.pk]
    assert [item.product_name for item in order_params.items] == ["Sali, Talo, Aikuiset", "Sali, Talo"]
    assert [item.vat_percentage for item in order_params.items] == [Decimal("25.5"), Decimal("10.0")]
    assert [item.row_price_net for item in order_params.items] == [Decimal("10.00"), Decimal("9.09")]
    assert [item.row_price_vat for item in order_params.items] == [Decimal("2.55"), Decimal("0.91")]
    assert [item.row_price_total for item in order_params.items] == [Decimal("12.55"), Decimal("10.00")]
    assert order_params.price_net == Decimal("19.09")
    assert order_params.price_vat == Decimal("3.46")
    assert order_params.price_total == Decimal("22.55")
    assert order_params.price_net == reservation.total_price_net


def test_get_verkkokauppa_order_params__uses_override_amount():
    reservation = ReservationFactory.create(
        price_lines__amount=Decimal(20),
        price_lines__override_amount=Decimal("12.55"),
        price_lines__tax_percentage=Decimal("25.5"),
        price_lines__payment_product=PaymentProductFactory.create(),
    )

    order_params = get_verkkokauppa_order_params(reservation)

    assert len(order_params.items) == 1
    assert order_params.items[0].row_price_total == Decimal("12.55")
    assert order_params.price_total == Decimal("12.55")


def test_get_verkkokauppa_order_params__leaves_out_free_price_lines():
    payment_product = PaymentProductFactory.create()
    reservation = ReservationFactory.create()
    ReservationPriceLineFactory.create(reservation=reservation, amount=Decimal(10), payment_product=payment_product)
    ReservationPriceLineFactory.create(reservation=reservation, amount=Decimal(0), payment_product=None)
    ReservationPriceLineFactory.create(
        reservation=reservation,
        amount=Decimal(10),
        override_amount=Decimal(0),
        payment_product=None,
    )

    order_params = get_verkkokauppa_order_params(reservation)

    assert [item.product_id for item in order_params.items] == [payment_product.pk]
