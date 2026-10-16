from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from django.urls import include, path
from freezegun import freeze_time

from config.urls import urlpatterns as config_urlpatterns
from tilavarauspalvelu.enums import ReserveeType
from tilavarauspalvelu.integrations.verkkokauppa.exceptions import UnsupportedMetaKeyError
from tilavarauspalvelu.integrations.verkkokauppa.helpers import (
    create_mock_verkkokauppa_order,
    get_formatted_reservation_time,
    get_meta_label,
    get_verkkokauppa_order_params,
)
from tilavarauspalvelu.integrations.verkkokauppa.order.types import Order, OrderCustomer, WebShopOrderStatus
from tilavarauspalvelu.models import ReservationUnit
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

from tests.factories import PaymentMerchantFactory, PaymentProductFactory, ReservationFactory, ReservationUnitFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Helpers ──


# The mock order tests use this module as their URL configuration.
# The project adds the mock checkout URLs only when 'MOCK_VERKKOKAUPPA_API_ENABLED' is set at startup.
urlpatterns = [
    *config_urlpatterns,
    path(
        "mock_verkkokauppa/",
        include("tilavarauspalvelu.api.mock_verkkokauppa_api.urls", namespace="mock_verkkokauppa"),
    ),
]


# ── Order params ──


@pytest.mark.parametrize(
    ("language", "result"),
    [
        ("fi", "La 5.11.2022 10:00-12:00"),
        ("sv", "Lö 5.11.2022 10:00-12:00"),
        ("en", "Sa 5.11.2022 10:00-12:00"),
    ],
)
@freeze_time("2022-11-05T10:00:00")
def test_get_formatted_reservation_time(language, result):
    begin = datetime.datetime.now().astimezone(tz=DEFAULT_TIMEZONE)
    end = begin + datetime.timedelta(hours=2)
    reservation = ReservationFactory.create(begins_at=begin, ends_at=end, user__preferred_language=language)
    date = get_formatted_reservation_time(reservation)
    assert date == result


def test_get_verkkokauppa_order_params__respect_reservee_language():
    payment_product = PaymentProductFactory.create()
    reservation_unit = ReservationUnitFactory.create(
        payment_product=payment_product,
        name_fi="Nimi",
        name_en="Name",
        name_sv="Namn",
        unit__name_fi="NIMI",
        unit__name_en="NAME",
        unit__name_sv="NAMN",
    )

    reservation_en = ReservationFactory.create(
        reservation_unit=reservation_unit,
        user__preferred_language="en",
        reservee_type=ReserveeType.INDIVIDUAL,
    )
    order_params = get_verkkokauppa_order_params(reservation_en)
    assert order_params.items[0].product_name == "Name, NAME"

    reservation_sv = ReservationFactory.create(
        reservation_unit=reservation_unit,
        user__preferred_language="sv",
        reservee_type=ReserveeType.INDIVIDUAL,
    )
    order_params = get_verkkokauppa_order_params(reservation_sv)
    assert order_params.items[0].product_name == "Namn, NAMN"


def test_get_meta_label():
    reservation = ReservationFactory.create(user__preferred_language="fi")

    period_label = get_meta_label("reservationPeriod", reservation)
    assert period_label == "Varausaika"

    number_label = get_meta_label("reservationNumber", reservation)
    assert number_label == "Varausnumero"


def test_get_meta_label__raises_exception_with_unsupported_key():
    reservation = ReservationFactory.create(user__preferred_language="fi")

    with pytest.raises(UnsupportedMetaKeyError) as err:
        get_meta_label("unsupported", reservation)
    assert str(err.value) == "Invalid meta label key 'unsupported'"


# ── Mock order ──


@pytest.mark.urls(__name__)
@freeze_time(local_datetime(2024, 1, 1, 12))
def test_create_mock_verkkokauppa_order__returns_draft_order_with_mock_urls():
    payment_product = PaymentProductFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit__payment_product=payment_product,
        user__first_name="John",
        user__last_name="Doe",
        user__email="john.doe@example.com",
        price=Decimal("124.00"),
        tax_percentage_value=Decimal("24.00"),
    )

    order = create_mock_verkkokauppa_order(reservation)

    assert order == Order(
        order_id=order.order_id,
        namespace="tilanvaraus",
        user="test-user",
        created_at=local_datetime(2024, 1, 1, 12),
        items=[],
        price_net=Decimal("100.00"),
        price_vat=Decimal("24.00"),
        price_total=Decimal("124.00"),
        customer=OrderCustomer(
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            phone="",
        ),
        status=WebShopOrderStatus.DRAFT,
        subscription_id=None,
        type="order",
        checkout_url=f"https://mock-verkkokauppa.com/mock_verkkokauppa/{order.order_id}/",
        receipt_url=f"https://mock-verkkokauppa.com/admin/tilavarauspalvelu/reservation/{reservation.pk}/change/?",
    )

    reservation.reservation_unit.refresh_from_db()
    assert reservation.reservation_unit.payment_product == payment_product


@pytest.mark.urls(__name__)
def test_create_mock_verkkokauppa_order__creates_product_for_existing_merchant():
    payment_merchant = PaymentMerchantFactory.create()
    reservation = ReservationFactory.create(
        reservation_unit__payment_product=None,
        reservation_unit__payment_merchant=payment_merchant,
    )

    create_mock_verkkokauppa_order(reservation)

    reservation_unit = ReservationUnit.objects.get(pk=reservation.reservation_unit.pk)
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.merchant == payment_merchant
    assert reservation_unit.payment_merchant == payment_merchant


@pytest.mark.urls(__name__)
def test_create_mock_verkkokauppa_order__creates_product_and_merchant_when_missing():
    reservation = ReservationFactory.create(
        reservation_unit__payment_product=None,
        reservation_unit__payment_merchant=None,
        reservation_unit__unit__payment_merchant=None,
    )

    create_mock_verkkokauppa_order(reservation)

    reservation_unit = ReservationUnit.objects.get(pk=reservation.reservation_unit.pk)
    assert reservation_unit.payment_merchant is not None
    assert reservation_unit.payment_merchant.name == "MOCK VERKKOKAUPPA MERCHANT"
    assert reservation_unit.payment_product is not None
    assert reservation_unit.payment_product.merchant == reservation_unit.payment_merchant
