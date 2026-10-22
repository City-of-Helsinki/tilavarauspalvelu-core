from __future__ import annotations

import datetime
from decimal import Decimal

import pytest

from tilavarauspalvelu.enums import PaymentType, PriceUnit
from tilavarauspalvelu.exceptions import PriceCalculationError
from tilavarauspalvelu.services.pricing.price_calculation import calculate_price
from utils.date_utils import local_datetime

from tests.factories import (
    PriceComponentFactory,
    PriceOptionFactory,
    PricingGroupFactory,
    ReservationUnitFactory,
    ReservationUnitPricingGroupFactory,
    UnitGroupFactory,
)
from tests.helpers import exact

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


JAN_1 = datetime.date(2026, 1, 1)
MAR_1 = datetime.date(2026, 3, 1)
MAR_2 = datetime.date(2026, 3, 2)


def reservation_unit_with_group(**group_kwargs):
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create(**group_kwargs)
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )
    return reservation_unit, pricing_group


# ── One price ──


def test_calculate_price__hourly_price():
    reservation_unit, pricing_group = reservation_unit_with_group()
    component = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ON_SITE,
    )

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 12),
    )

    assert len(result.lines) == 1
    assert result.lines[0].component == component
    assert result.lines[0].quantity == Decimal(2)
    assert result.lines[0].unit_amount == Decimal(10)
    assert result.lines[0].amount == Decimal("20.00")
    assert result.total == Decimal("20.00")
    assert result.payment_type == PaymentType.ON_SITE
    assert result.can_apply_for_discount is False


def test_calculate_price__duration_is_rounded_up_to_15_minutes():
    reservation_unit, pricing_group = reservation_unit_with_group()
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
    )

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 11, 10),
    )

    assert result.lines[0].quantity == Decimal("1.25")
    assert result.total == Decimal("12.50")


def test_calculate_price__fixed_price():
    reservation_unit, pricing_group = reservation_unit_with_group()
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        amount=Decimal(50),
        price_unit=PriceUnit.FIXED,
    )

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 15),
    )

    assert result.lines[0].quantity == Decimal(1)
    assert result.total == Decimal("50.00")


def test_calculate_price__free():
    reservation_unit, pricing_group = reservation_unit_with_group()
    PriceComponentFactory.create_free(pricing_group=pricing_group, valid_from=JAN_1, can_apply_for_discount=False)

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 12),
    )

    assert result.total == Decimal("0.00")
    assert result.payment_type is None


def test_calculate_price__can_apply_for_discount():
    reservation_unit, pricing_group = reservation_unit_with_group()
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, can_apply_for_discount=True)

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 12),
    )

    assert result.can_apply_for_discount is True


# ── Price change ──


def test_calculate_price__reservation_over_the_date_of_a_price_change():
    reservation_unit, pricing_group = reservation_unit_with_group()
    old = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        valid_until=MAR_2,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
    )
    new = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=MAR_2,
        amount=Decimal(20),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
        can_apply_for_discount=True,
    )

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 3, 1, 22),
        end=local_datetime(2026, 3, 2, 1),
    )

    assert [line.component for line in result.lines] == [old, new]
    assert [line.quantity for line in result.lines] == [Decimal(2), Decimal(1)]
    assert [line.amount for line in result.lines] == [Decimal("20.00"), Decimal("20.00")]
    assert result.total == Decimal("40.00")
    assert result.can_apply_for_discount is True


def test_calculate_price__day_unit_is_charged_at_the_price_of_its_start():
    reservation_unit, pricing_group = reservation_unit_with_group()
    old = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        valid_until=MAR_2,
        amount=Decimal(100),
        price_unit=PriceUnit.PER_DAY,
    )
    new = PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=MAR_2,
        amount=Decimal(200),
        price_unit=PriceUnit.PER_DAY,
    )

    one_day = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 3, 1, 12),
        end=local_datetime(2026, 3, 2, 12),
    )
    two_days = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 3, 1, 12),
        end=local_datetime(2026, 3, 2, 13),
    )

    assert [line.component for line in one_day.lines] == [old]
    assert one_day.total == Decimal("100.00")
    assert [line.component for line in two_days.lines] == [old, new]
    assert two_days.total == Decimal("300.00")


def test_calculate_price__pricing_group_is_chosen_by_start_date():
    reservation_unit, first_group = reservation_unit_with_group()
    PriceComponentFactory.create(pricing_group=first_group, valid_from=JAN_1, amount=Decimal(10))

    second_group = PricingGroupFactory.create()
    PriceComponentFactory.create(pricing_group=second_group, valid_from=MAR_1, amount=Decimal(30))
    ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=second_group,
        begins=MAR_1,
    )

    before = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 28, 10),
        end=local_datetime(2026, 2, 28, 11),
    )
    after = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 3, 1, 10),
        end=local_datetime(2026, 3, 1, 11),
    )

    assert before.total == Decimal("10.00")
    assert after.total == Decimal("30.00")


# ── Price options ──


def test_calculate_price__selected_option():
    unit_group = UnitGroupFactory.create()
    reservation_unit, pricing_group = reservation_unit_with_group(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group)
    juniors = PriceOptionFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, amount=Decimal(20))
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=juniors, amount=Decimal(10))

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=juniors,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 11),
    )

    assert result.total == Decimal("10.00")


def test_calculate_price__option_is_required_when_the_group_has_options():
    unit_group = UnitGroupFactory.create()
    reservation_unit, pricing_group = reservation_unit_with_group(unit_group=unit_group)
    adults = PriceOptionFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)

    with pytest.raises(PriceCalculationError, match=exact("Reservation unit has no price on 2026-02-01.")):
        calculate_price(
            reservation_unit=reservation_unit,
            price_option=None,
            begin=local_datetime(2026, 2, 1, 10),
            end=local_datetime(2026, 2, 1, 11),
        )


# ── Errors ──


def test_calculate_price__no_pricing_group():
    reservation_unit = ReservationUnitFactory.create()

    with pytest.raises(PriceCalculationError, match=exact("Reservation unit has no pricing group on 2026-02-01.")):
        calculate_price(
            reservation_unit=reservation_unit,
            price_option=None,
            begin=local_datetime(2026, 2, 1, 10),
            end=local_datetime(2026, 2, 1, 11),
        )


def test_calculate_price__end_before_begin():
    reservation_unit, _ = reservation_unit_with_group()

    with pytest.raises(PriceCalculationError, match=exact("Reservation must end after it begins.")):
        calculate_price(
            reservation_unit=reservation_unit,
            price_option=None,
            begin=local_datetime(2026, 2, 1, 11),
            end=local_datetime(2026, 2, 1, 10),
        )
