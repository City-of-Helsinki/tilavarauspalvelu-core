import datetime
from decimal import Decimal

import pytest
from django.db import IntegrityError

from tilavarauspalvelu.models import PriceComponent

from tests.factories import PriceComponentFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Amount ──


def test_price_component__amount_cannot_be_negative():
    with pytest.raises(IntegrityError) as error:
        PriceComponentFactory.create(amount=Decimal(-1))

    assert "price_component_amount_not_negative" in str(error.value)


# ── Discount ──


def test_price_component__free_component_cannot_allow_discount():
    with pytest.raises(IntegrityError) as error:
        PriceComponentFactory.create_free(can_apply_for_discount=True)

    assert "price_component_base_discount_only_when_paid" in str(error.value)


def test_price_component__paid_component_can_allow_discount():
    component = PriceComponentFactory.create(amount=Decimal(10), can_apply_for_discount=True)

    component = PriceComponent.objects.get(pk=component.pk)
    assert component.can_apply_for_discount is True


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
