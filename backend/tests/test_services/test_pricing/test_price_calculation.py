from __future__ import annotations

import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

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

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ReservationUnitPricingGroup, UnitGroup

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


JAN_1 = datetime.date(2026, 1, 1)
MAR_1 = datetime.date(2026, 3, 1)
MAR_2 = datetime.date(2026, 3, 2)


# ── Helpers ──


def create_pricing_group_row(*, unit_group: UnitGroup | None = None) -> ReservationUnitPricingGroup:
    """A reservation unit that uses a new pricing group from January 1st onward."""
    reservation_unit = ReservationUnitFactory.create()
    pricing_group = PricingGroupFactory.create(unit_group=unit_group)
    return ReservationUnitPricingGroupFactory.create(
        reservation_unit=reservation_unit,
        pricing_group=pricing_group,
        begins=JAN_1,
    )


# ── One price ──


def test_calculate_price__hourly_price():
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
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
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
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


@pytest.mark.parametrize(
    ("date", "expected_hours"),
    [
        (datetime.date(2026, 3, 29), Decimal(5)),
        (datetime.date(2026, 10, 25), Decimal(7)),
    ],
)
def test_calculate_price__daylight_saving_change_counts_real_hours(date, expected_hours):
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        amount=Decimal(10),
        price_unit=PriceUnit.PER_HOUR,
    )

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(date.year, date.month, date.day, 0),
        end=local_datetime(date.year, date.month, date.day, 6),
    )

    assert result.lines[0].quantity == expected_hours
    assert result.total == expected_hours * 10


def test_calculate_price__fixed_price():
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
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
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
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
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1, can_apply_for_discount=True)

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 12),
    )

    assert result.can_apply_for_discount is True


# ── Price units ──


def test_calculate_price__per_15_minutes():
    row = create_pricing_group_row()
    PriceComponentFactory.create(
        pricing_group=row.pricing_group,
        valid_from=JAN_1,
        amount=Decimal(5),
        price_unit=PriceUnit.PER_15_MINS,
    )

    result = calculate_price(
        reservation_unit=row.reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 1, 11),
    )

    assert result.lines[0].quantity == Decimal(4)
    assert result.total == Decimal("20.00")


@pytest.mark.parametrize(
    ("end_hour", "expected_quantity"),
    [
        (20, Decimal(1)),
        (21, Decimal(2)),
    ],
)
def test_calculate_price__per_half_day_counts_started_12_hour_units(end_hour, expected_quantity):
    row = create_pricing_group_row()
    PriceComponentFactory.create(
        pricing_group=row.pricing_group,
        valid_from=JAN_1,
        amount=Decimal(50),
        price_unit=PriceUnit.PER_HALF_DAY,
    )

    result = calculate_price(
        reservation_unit=row.reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 8),
        end=local_datetime(2026, 2, 1, end_hour),
    )

    assert result.lines[0].quantity == expected_quantity
    assert result.total == Decimal(50) * expected_quantity


def test_calculate_price__per_week():
    row = create_pricing_group_row()
    PriceComponentFactory.create(
        pricing_group=row.pricing_group,
        valid_from=JAN_1,
        amount=Decimal(300),
        price_unit=PriceUnit.PER_WEEK,
    )

    result = calculate_price(
        reservation_unit=row.reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 2, 1, 10),
        end=local_datetime(2026, 2, 3, 10),
    )

    assert result.lines[0].quantity == Decimal(1)
    assert result.total == Decimal("300.00")


# ── Price change ──


def test_calculate_price__reservation_over_the_date_of_a_price_change():
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
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


def test_calculate_price__payment_type_from_paid_date_after_free_date():
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
    PriceComponentFactory.create_free(
        pricing_group=pricing_group,
        valid_from=JAN_1,
        valid_until=MAR_2,
        price_unit=PriceUnit.PER_HOUR,
    )
    PriceComponentFactory.create(
        pricing_group=pricing_group,
        valid_from=MAR_2,
        amount=Decimal(20),
        price_unit=PriceUnit.PER_HOUR,
        payment_type=PaymentType.ONLINE,
    )

    result = calculate_price(
        reservation_unit=reservation_unit,
        price_option=None,
        begin=local_datetime(2026, 3, 1, 22),
        end=local_datetime(2026, 3, 2, 1),
    )

    assert result.total == Decimal("20.00")
    assert result.payment_type == PaymentType.ONLINE


def test_calculate_price__day_unit_is_charged_at_the_price_of_its_start():
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
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
    row = create_pricing_group_row()
    reservation_unit = row.reservation_unit
    first_group = row.pricing_group
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
    row = create_pricing_group_row(unit_group=unit_group)
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
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
    row = create_pricing_group_row(unit_group=unit_group)
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
    adults = PriceOptionFactory.create(unit_group=unit_group)
    PriceComponentFactory.create(pricing_group=pricing_group, price_option=adults, valid_from=JAN_1)

    with pytest.raises(PriceCalculationError, match=exact("Reservation unit has no price on 2026-02-01.")):
        calculate_price(
            reservation_unit=reservation_unit,
            price_option=None,
            begin=local_datetime(2026, 2, 1, 10),
            end=local_datetime(2026, 2, 1, 11),
        )


@pytest.mark.parametrize("group_has_unit_group", [True, False])
def test_calculate_price__option_of_another_unit_group(group_has_unit_group):
    unit_group = UnitGroupFactory.create() if group_has_unit_group else None
    row = create_pricing_group_row(unit_group=unit_group)
    reservation_unit = row.reservation_unit
    pricing_group = row.pricing_group
    PriceComponentFactory.create(pricing_group=pricing_group, valid_from=JAN_1)
    other_option = PriceOptionFactory.create()

    msg = "Price option does not belong to the unit group of the pricing group."
    with pytest.raises(PriceCalculationError, match=exact(msg)):
        calculate_price(
            reservation_unit=reservation_unit,
            price_option=other_option,
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
    reservation_unit = create_pricing_group_row().reservation_unit

    with pytest.raises(PriceCalculationError, match=exact("Reservation must end after it begins.")):
        calculate_price(
            reservation_unit=reservation_unit,
            price_option=None,
            begin=local_datetime(2026, 2, 1, 11),
            end=local_datetime(2026, 2, 1, 10),
        )
