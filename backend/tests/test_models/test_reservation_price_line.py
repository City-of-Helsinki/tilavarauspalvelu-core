from __future__ import annotations

from decimal import Decimal

import pytest
from django.db import IntegrityError

from tilavarauspalvelu.models import ReservationPriceLine

from tests.factories import ReservationPriceLineFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


# ── Quantity ──


@pytest.mark.parametrize("quantity", [Decimal(0), Decimal(-1)])
def test_reservation_price_line__quantity_must_be_positive(quantity):
    with pytest.raises(IntegrityError) as error:
        ReservationPriceLineFactory.create(quantity=quantity)

    assert "reservation_price_line_quantity_positive" in str(error.value)


# ── Amounts ──


@pytest.mark.parametrize(
    ("unit_amount", "amount_before_adjustment", "amount"),
    [
        (Decimal(-1), Decimal(10), Decimal(10)),
        (Decimal(10), Decimal(-1), Decimal(10)),
        (Decimal(10), Decimal(10), Decimal(-1)),
    ],
)
def test_reservation_price_line__amounts_cannot_be_negative(unit_amount, amount_before_adjustment, amount):
    with pytest.raises(IntegrityError) as error:
        ReservationPriceLineFactory.create(
            unit_amount=unit_amount,
            amount_before_adjustment=amount_before_adjustment,
            amount=amount,
        )

    assert "reservation_price_line_amounts_not_negative" in str(error.value)


def test_reservation_price_line__override_amount_cannot_be_negative():
    with pytest.raises(IntegrityError) as error:
        ReservationPriceLineFactory.create(override_amount=Decimal(-1))

    assert "reservation_price_line_override_amount_not_negative" in str(error.value)


@pytest.mark.parametrize("override_amount", [None, Decimal(0)])
def test_reservation_price_line__override_amount_can_be_empty_or_zero(override_amount):
    line = ReservationPriceLineFactory.create(override_amount=override_amount)

    line = ReservationPriceLine.objects.get(pk=line.pk)
    assert line.override_amount == override_amount
