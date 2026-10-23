from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from graphene_django_extensions.testing import build_query

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.services.pricing.price_lines import set_reservation_price_lines
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime

from tests.factories import (
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


JAN_1 = datetime.date(2026, 1, 1)
MAR_1 = datetime.date(2026, 3, 1)

LINE_FIELDS = (
    "descriptionFi descriptionEn descriptionSv quantity priceUnit unitAmount amount taxPercentage "
    "materialPriceDescriptionFi materialPriceDescriptionEn materialPriceDescriptionSv"
)
FIELDS = f"lines {{ {LINE_FIELDS} }} total canApplyForDiscount paymentType"


# ── Price ──


def test_reservation_price__hourly_price(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        can_apply_for_discount=True,
        material_price_description_fi="Materiaalit",
        material_price_description_en="Materials",
        material_price_description_sv="Material",
    )

    query = build_query(
        "reservationPrice",
        fields=FIELDS,
        reservation_unit=reservation_unit.pk,
        begins_at=local_datetime(2026, 2, 1, 10).isoformat(),
        ends_at=local_datetime(2026, 2, 1, 12).isoformat(),
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "lines": [
            {
                "descriptionFi": "",
                "descriptionEn": "",
                "descriptionSv": "",
                "quantity": "2.0000",
                "priceUnit": PriceUnit.PER_HOUR.value,
                "unitAmount": "10.00",
                "amount": "20.00",
                "taxPercentage": "0",
                "materialPriceDescriptionFi": "Materiaalit",
                "materialPriceDescriptionEn": "Materials",
                "materialPriceDescriptionSv": "Material",
            },
        ],
        "total": "20.00",
        "canApplyForDiscount": True,
        "paymentType": PaymentType.ONLINE.value,
    }


def test_reservation_price__same_as_reservation_price_lines(graphql):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create()
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        valid_until=MAR_1,
        amount=Decimal("12.50"),
        price_unit=PriceUnit.PER_30_MINS,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=MAR_1,
        amount=Decimal(40),
        price_unit=PriceUnit.PER_HOUR,
    )
    begins_at = local_datetime(2026, 2, 28, 22, 10)
    ends_at = local_datetime(2026, 3, 1, 1, 20)
    reservation = ReservationFactory.create(reservation_unit=reservation_unit, begins_at=begins_at, ends_at=ends_at)

    set_reservation_price_lines(reservation=reservation, price_option=None)

    query = build_query(
        "reservationPrice",
        fields="lines { quantity amount } total",
        reservation_unit=reservation_unit.pk,
        begins_at=begins_at.isoformat(),
        ends_at=ends_at.isoformat(),
    )
    response = graphql(query)

    assert response.has_errors is False, response

    reservation = Reservation.objects.get(pk=reservation.pk)
    saved_lines = [
        {"quantity": str(line.quantity), "amount": str(line.amount)} for line in reservation.price_lines.all()
    ]
    assert len(saved_lines) == 2
    assert response.first_query_object == {"lines": saved_lines, "total": str(reservation.price)}


# ── Price option ──


def test_reservation_price__with_price_option(graphql):
    reservation_unit = ReservationUnitFactory.create()
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    adults = PriceOptionFactory.create(unit_group=unit_group, name_fi="Aikuiset", name_en="Adults", name_sv="Vuxna")
    juniors = PriceOptionFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, price_option=adults, amount=20)
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, price_option=juniors, amount=10)

    query = build_query(
        "reservationPrice",
        fields="lines { descriptionFi descriptionEn descriptionSv } total",
        reservation_unit=reservation_unit.pk,
        price_option=adults.pk,
        begins_at=local_datetime(2026, 2, 1, 10).isoformat(),
        ends_at=local_datetime(2026, 2, 1, 11).isoformat(),
    )
    response = graphql(query)

    assert response.has_errors is False, response
    assert response.first_query_object == {
        "lines": [{"descriptionFi": "Aikuiset", "descriptionEn": "Adults", "descriptionSv": "Vuxna"}],
        "total": "20.00",
    }


def test_reservation_price__inactive_price_option(graphql):
    reservation_unit = ReservationUnitFactory.create()
    unit_group = UnitGroupFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    option = PriceOptionFactory.create(unit_group=unit_group, is_active=False)
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, price_option=option)

    query = build_query(
        "reservationPrice",
        fields="total",
        reservation_unit=reservation_unit.pk,
        price_option=option.pk,
        begins_at=local_datetime(2026, 2, 1, 10).isoformat(),
        ends_at=local_datetime(2026, 2, 1, 11).isoformat(),
    )
    response = graphql(query)

    assert response.error_message() == "Price option is not active."
    assert response.error_code() == error_codes.PRICE_OPTION_INACTIVE


# ── Errors ──


def test_reservation_price__no_pricing_group(graphql):
    reservation_unit = ReservationUnitFactory.create()

    query = build_query(
        "reservationPrice",
        fields="total",
        reservation_unit=reservation_unit.pk,
        begins_at=local_datetime(2026, 2, 1, 10).isoformat(),
        ends_at=local_datetime(2026, 2, 1, 11).isoformat(),
    )
    response = graphql(query)

    assert response.error_message() == "Reservation unit has no pricing group on 2026-02-01."
    assert response.error_code() == error_codes.PRICE_CALCULATION_FAILED


def test_reservation_price__ends_before_it_begins(graphql):
    reservation_unit = ReservationUnitFactory.create()

    query = build_query(
        "reservationPrice",
        fields="total",
        reservation_unit=reservation_unit.pk,
        begins_at=local_datetime(2026, 2, 1, 11).isoformat(),
        ends_at=local_datetime(2026, 2, 1, 10).isoformat(),
    )
    response = graphql(query)

    assert response.error_message() == "Reservation must end after it begins."
    assert response.error_code() == error_codes.PRICE_CALCULATION_FAILED


def test_reservation_price__reservation_unit_not_found(graphql):
    query = build_query(
        "reservationPrice",
        fields="total",
        reservation_unit=0,
        begins_at=local_datetime(2026, 2, 1, 10).isoformat(),
        ends_at=local_datetime(2026, 2, 1, 11).isoformat(),
    )
    response = graphql(query)

    assert response.error_message() == "Reservation unit with pk 0 does not exist."
