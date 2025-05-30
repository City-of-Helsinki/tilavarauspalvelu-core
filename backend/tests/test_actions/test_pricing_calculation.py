from __future__ import annotations

import datetime
from decimal import Decimal

import pytest
from freezegun import freeze_time

from tilavarauspalvelu.enums import PriceUnit
from utils.date_utils import local_datetime

from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_calculate_reservation_price__subsidised_price_is_equal_to_lowest_price__fixed_price():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=2)

    pricing = ReservationUnitPricingFactory.create(price_unit=PriceUnit.FIXED)

    price = pricing.actions.calculate_reservation_price(duration=end - begin)
    subsidised_price = pricing.actions.calculate_reservation_price(duration=end - begin, subsidised=True)

    assert price == Decimal(10)
    assert subsidised_price == pricing.lowest_price


def test_calculate_reservation_price__subsidised_price_is_equal_to_lowest_price__hourly_price():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=2)

    pricing = ReservationUnitPricingFactory.create(price_unit=PriceUnit.PER_HOUR)

    price = pricing.actions.calculate_reservation_price(duration=end - begin)
    subsidised_price = pricing.actions.calculate_reservation_price(duration=end - begin, subsidised=True)

    assert price == pricing.highest_price * 2
    assert subsidised_price == pricing.lowest_price * 2


def test_calculate_reservation_price__pricing_is_calculated_per_15_min_with_pricing_unit_less_than_half_day():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=1, minutes=15)

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PER_HOUR,
        lowest_price=Decimal("40.0"),
        highest_price=Decimal("40.0"),
    )

    price = pricing.actions.calculate_reservation_price(duration=end - begin)

    assert price == pricing.lowest_price * Decimal("1.25")


def test_calculate_reservation_price__pricing_is_fixed_with_pricing_unit_more_than_half_day():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=14)

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PER_HALF_DAY,
        lowest_price=Decimal("100.0"),
        highest_price=Decimal("100.0"),
    )

    price = pricing.actions.calculate_reservation_price(duration=end - begin)

    assert price == pricing.lowest_price


def test_calculate_reservation_price__pricing_is_fixed_even_when_duration_is_double_the_pricing_unit():
    begin = local_datetime()
    end = begin + datetime.timedelta(days=1)

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PER_HALF_DAY,
        lowest_price=Decimal("100.0"),
        highest_price=Decimal("100.0"),
    )

    price = pricing.actions.calculate_reservation_price(duration=end - begin)

    assert price == pricing.lowest_price


def test_get_active_pricing__future_has_same_tax_percentage():
    day_1 = local_datetime()
    day_2 = day_1 + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    pricing_1 = ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_1,
        tax_percentage__value=Decimal(24),
        price_unit=PriceUnit.FIXED,
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_2,
        tax_percentage__value=Decimal(24),
        price_unit=PriceUnit.FIXED,
        highest_price=Decimal("100.0"),
    )

    pricing = reservation_unit.actions.get_active_pricing(by_date=day_1.date())
    assert pricing.tax_percentage.value == pricing_1.tax_percentage.value

    pricing = reservation_unit.actions.get_active_pricing(by_date=day_2.date())
    assert pricing.tax_percentage.value == pricing_2.tax_percentage.value


def test_get_active_pricing__is_activated_on_begins():
    day_1 = local_datetime()
    day_2 = day_1 + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    pricing_1 = ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_1,
        tax_percentage__value=Decimal(24),
        price_unit=PriceUnit.FIXED,
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_2,
        tax_percentage__value=Decimal("25.5"),
        price_unit=PriceUnit.FIXED,
        is_activated_on_begins=True,
    )

    # Price for day 1 is used as expected
    pricing = reservation_unit.actions.get_active_pricing(by_date=day_1.date())
    assert pricing.tax_percentage.value == pricing_1.tax_percentage.value

    # Price for day 2 still uses the price from day 1, as the price for day 2 has different tax % and isn't ACTIVE yet
    pricing = reservation_unit.actions.get_active_pricing(by_date=day_2.date())
    assert pricing.tax_percentage.value == pricing_1.tax_percentage.value

    with freeze_time(day_2):
        # Price for day 2 is now used as expected
        pricing = reservation_unit.actions.get_active_pricing(by_date=day_2.date())
        assert pricing.tax_percentage.value == pricing_2.tax_percentage.value


def test_get_active_pricing__active_is_free_future_is_paid_and_different_tax_percentage():
    day_1 = local_datetime()
    day_2 = day_1 + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create_free(
        reservation_unit=reservation_unit,
        begins=day_1,
        price_unit=PriceUnit.FIXED,
    )
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_2,
        tax_percentage__value=Decimal("25.5"),
        price_unit=PriceUnit.FIXED,
    )

    pricing = reservation_unit.actions.get_active_pricing(by_date=day_1.date())
    assert pricing.tax_percentage.value == Decimal(0)

    pricing = reservation_unit.actions.get_active_pricing(by_date=day_2.date())
    assert pricing.tax_percentage.value == Decimal("25.5")


def test_get_active_pricing__active_is_paid_future_is_free_and_different_tax_percentage():
    day_1 = local_datetime()
    day_2 = day_1 + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_1,
        tax_percentage__value=Decimal("25.5"),
        price_unit=PriceUnit.FIXED,
    )
    ReservationUnitPricingFactory.create_free(
        reservation_unit=reservation_unit,
        begins=day_2,
        price_unit=PriceUnit.FIXED,
    )

    pricing = reservation_unit.actions.get_active_pricing(by_date=day_1.date())
    assert pricing.tax_percentage.value == Decimal("25.5")

    pricing = reservation_unit.actions.get_active_pricing(by_date=day_2.date())
    assert pricing.tax_percentage.value == Decimal(0)
