from datetime import timedelta
from decimal import Decimal

import freezegun
import pytest
from django.conf import settings

from common.date_utils import local_datetime
from merchants.verkkokauppa.helpers import get_verkkokauppa_order_params
from reservations.choices import CustomerTypeChoice
from tests.factories import PaymentProductFactory, ReservationFactory, ReservationUnitFactory, UserFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


@freezegun.freeze_time("2023-01-01 00:00:00")
def test_get_verkkokauppa_order_params__to_json():
    payment_product = PaymentProductFactory.create()
    reservation_unit = ReservationUnitFactory.create(payment_product=payment_product)
    user = UserFactory.create(
        username="test",
        email="test@localhost",
        first_name="First",
        last_name="Last",
    )
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        user=user,
        price_net=Decimal("10.12"),
        price=Decimal("12.5488"),
        tax_percentage_value=Decimal("24"),
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_first_name="Firstname",
        reservee_last_name="Lastname",
        reservee_email="test@example.com",
        reservee_phone="+358 50 123 4567",
        reservee_language="fi",
    )

    order_params = get_verkkokauppa_order_params(reservation)
    json = order_params.to_json()

    assert json["namespace"] == settings.VERKKOKAUPPA_NAMESPACE
    assert json["user"] == str(reservation.user.uuid)
    assert json["language"] == reservation.reservee_language or "fi"
    assert json["priceNet"] == "10.12"
    assert json["priceVat"] == "2.43"
    assert json["priceTotal"] == "12.55"
    assert json["customer"]["firstName"] == "First"
    assert json["customer"]["lastName"] == "Last"
    assert json["customer"]["email"] == "test@localhost"
    assert json["customer"]["phone"] == ""
    assert json["lastValidPurchaseDateTime"] == (
        local_datetime() + timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)
    ).strftime("%Y-%m-%dT%H:%M:%S")

    assert len(json["items"]) == 1
    assert json["items"][0]["productId"] == str(reservation.reservation_unit.first().payment_product.id)
    assert json["items"][0]["productName"] == reservation.reservation_unit.first().name_fi
    assert json["items"][0]["quantity"] == 1
    assert json["items"][0]["unit"] == "pcs"
    assert json["items"][0]["rowPriceNet"] == "10.12"
    assert json["items"][0]["rowPriceVat"] == "2.43"
    assert json["items"][0]["rowPriceTotal"] == "12.55"
    assert json["items"][0]["priceNet"] == "10.12"
    assert json["items"][0]["priceVat"] == "2.43"
    assert json["items"][0]["priceGross"] == "12.55"
    assert json["items"][0]["vatPercentage"] == "24"  # Note this needs to be 24, not 24.00.
    assert len(json["items"][0]["meta"]) == 3
    assert json["items"][0]["meta"][0]["key"] == "namespaceProductId"
    assert json["items"][0]["meta"][0]["value"] == str(reservation.reservation_unit.first().uuid)
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
    payment_product = PaymentProductFactory.create()
    reservation_unit = ReservationUnitFactory.create(payment_product=payment_product)
    user = UserFactory.create(
        username="test",
        email="test@localhost",
        first_name="First",
        last_name="Name",
    )
    reservation = ReservationFactory.create(
        reservation_unit=[reservation_unit],
        user=user,
        price_net=Decimal("10.12"),
        price=Decimal("12.5488"),
        tax_percentage_value=Decimal("24"),
        reservee_type=CustomerTypeChoice.INDIVIDUAL,
        reservee_first_name="Firstname",
        reservee_last_name="Lastname",
        reservee_email="test@example.com",
        reservee_phone="+358 50 123 4567",
        reservee_language="en",
    )

    order_params = get_verkkokauppa_order_params(reservation)
    json = order_params.to_json()

    assert len(json["items"][0]["meta"]) == 3
    assert json["items"][0]["meta"][1]["label"] == "Booking time"
    assert json["items"][0]["meta"][2]["label"] == "Booking number"
