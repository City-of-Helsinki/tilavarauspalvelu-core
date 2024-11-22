import datetime
from decimal import Decimal

import pytest
from freezegun import freeze_time

from tests.factories import ReservationUnitFactory, ReservationUnitPricingFactory
from tilavarauspalvelu.api.graphql.types.reservation.serializers.mixins import ReservationPriceMixin
from tilavarauspalvelu.enums import PriceUnit
from utils.date_utils import local_datetime

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__calculate_price__subsidised_price_is_equal_to_lowest_price__fixed_price():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=2)

    pricing = ReservationUnitPricingFactory.create(price_unit=PriceUnit.PRICE_UNIT_FIXED)
    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == Decimal(10)
    assert prices.subsidised_price == pricing.lowest_price


def test_reservation__calculate_price__subsidised_price_is_equal_to_lowest_price__hourly_price():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=2)

    pricing = ReservationUnitPricingFactory.create(price_unit=PriceUnit.PRICE_UNIT_PER_HOUR)
    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == pricing.highest_price * 2
    assert prices.subsidised_price == pricing.lowest_price * 2


def test_reservation__calculate_price__pricing_is_calculated_per_15_min_with_pricing_unit_less_than_half_day():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=1, minutes=15)

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=Decimal("40.0"),
        highest_price=Decimal("40.0"),
    )

    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == pricing.lowest_price * Decimal("1.25")


def test_reservation__calculate_price__pricing_is_fixed_with_pricing_unit_more_than_half_day():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=14)

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
        lowest_price=Decimal("100.0"),
        highest_price=Decimal("100.0"),
    )

    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == pricing.lowest_price


def test_reservation__calculate_price__pricing_is_fixed_even_when_duration_is_double_the_pricing_unit():
    begin = local_datetime()
    end = begin + datetime.timedelta(days=1)

    pricing = ReservationUnitPricingFactory.create(
        price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
        lowest_price=Decimal("100.0"),
        highest_price=Decimal("100.0"),
    )

    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == pricing.lowest_price


def test_reservation__calculate_price__future_has_same_tax_percentage():
    day_1 = local_datetime()
    day_2 = day_1 + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    pricing_1 = ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_1,
        tax_percentage__value=Decimal(24),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_2,
        tax_percentage__value=Decimal(24),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        highest_price=Decimal("100.0"),
    )

    prices_1 = ReservationPriceMixin().calculate_price(day_1, day_1, [reservation_unit])
    assert prices_1.tax_percentage_value == pricing_1.tax_percentage.value

    prices_2 = ReservationPriceMixin().calculate_price(day_2, day_2, [reservation_unit])
    assert prices_2.tax_percentage_value == pricing_2.tax_percentage.value


def test_reservation__calculate_price__is_activated_on_begins():
    day_1 = local_datetime()
    day_2 = day_1 + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    pricing_1 = ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_1,
        tax_percentage__value=Decimal(24),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
    )
    pricing_2 = ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_2,
        tax_percentage__value=Decimal("25.5"),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
        is_activated_on_begins=True,
    )

    # Price for day 1 is used as expected
    prices = ReservationPriceMixin().calculate_price(day_1, day_1, [reservation_unit])
    assert prices.tax_percentage_value == pricing_1.tax_percentage.value

    # Price for day 2 still uses the price from day 1, as the price for day 2 has different tax % and isn't ACTIVE yet
    prices = ReservationPriceMixin().calculate_price(day_2, day_2, [reservation_unit])
    assert prices.tax_percentage_value == pricing_1.tax_percentage.value

    with freeze_time(day_2):
        # Price for day 2 is now used as expected
        prices = ReservationPriceMixin().calculate_price(day_2, day_2, [reservation_unit])
        assert prices.tax_percentage_value == pricing_2.tax_percentage.value


def test_reservation__calculate_price__active_is_free_future_is_paid_and_different_tax_percentage():
    day_1 = local_datetime()
    day_2 = day_1 + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create_free(
        reservation_unit=reservation_unit,
        begins=day_1,
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
    )
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_2,
        tax_percentage__value=Decimal("25.5"),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
    )

    prices = ReservationPriceMixin().calculate_price(day_1, day_1, [reservation_unit])
    assert prices.tax_percentage_value == Decimal(0)

    prices = ReservationPriceMixin().calculate_price(day_2, day_2, [reservation_unit])
    assert prices.tax_percentage_value == Decimal("25.5")


def test_reservation__calculate_price__active_is_paid_future_is_free_and_different_tax_percentage():
    day_1 = local_datetime()
    day_2 = day_1 + datetime.timedelta(days=1)

    reservation_unit = ReservationUnitFactory.create()
    ReservationUnitPricingFactory.create(
        reservation_unit=reservation_unit,
        begins=day_1,
        tax_percentage__value=Decimal("25.5"),
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
    )
    ReservationUnitPricingFactory.create_free(
        reservation_unit=reservation_unit,
        begins=day_2,
        price_unit=PriceUnit.PRICE_UNIT_FIXED,
    )

    prices = ReservationPriceMixin().calculate_price(day_1, day_1, [reservation_unit])
    assert prices.tax_percentage_value == Decimal("25.5")

    prices = ReservationPriceMixin().calculate_price(day_2, day_2, [reservation_unit])
    assert prices.tax_percentage_value == Decimal(0)
