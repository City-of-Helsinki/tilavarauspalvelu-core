from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from django.db import IntegrityError

from tilavarauspalvelu.enums import PaymentType
from tilavarauspalvelu.models import PriceComponent

from tests.factories import PriceComponentFactory, ReservationUnitFactory, ReservationUnitPricingGroupFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Amount ──


def test_price_component__amount_cannot_be_negative():
    with pytest.raises(IntegrityError) as error:
        PriceComponentFactory.create(amount=Decimal(-1))

    assert "price_component_amount_not_negative" in str(error.value)


# ── Payment type ──


def test_price_component__paid_component_needs_payment_type():
    with pytest.raises(IntegrityError) as error:
        PriceComponentFactory.create(amount=Decimal(10), payment_type=None)

    assert "price_component_payment_type_only_when_paid" in str(error.value)


def test_price_component__free_component_cannot_have_payment_type():
    with pytest.raises(IntegrityError) as error:
        PriceComponentFactory.create(amount=Decimal(0), payment_type=PaymentType.ONLINE)

    assert "price_component_payment_type_only_when_paid" in str(error.value)


def test_price_component__free_component_without_payment_type():
    component = PriceComponentFactory.create_free()

    component = PriceComponent.objects.get(pk=component.pk)
    assert component.amount == Decimal(0)
    assert component.payment_type is None


# ── Validity ──


@pytest.mark.parametrize(
    "valid_until",
    [
        datetime.date(2026, 1, 1),
        datetime.date(2025, 12, 31),
    ],
)
def test_price_component__valid_until_must_be_after_valid_from(valid_until):
    with pytest.raises(IntegrityError) as error:
        PriceComponentFactory.create(valid_from=datetime.date(2026, 1, 1), valid_until=valid_until)

    assert "price_component_valid_from_before_valid_until" in str(error.value)


def test_price_component__valid_until_can_be_empty():
    component = PriceComponentFactory.create(valid_from=datetime.date(2026, 1, 1), valid_until=None)

    component = PriceComponent.objects.get(pk=component.pk)
    assert component.valid_until is None


# ── Reservation unit pricing group ──


def test_reservation_unit_pricing_group__one_group_per_reservation_unit_and_date():
    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, begins=datetime.date(2026, 1, 1))

    with pytest.raises(IntegrityError) as error:
        ReservationUnitPricingGroupFactory.create(reservation_unit=reservation_unit, begins=datetime.date(2026, 1, 1))

    assert "reservation_unit_pricing_group_begins_unique" in str(error.value)
