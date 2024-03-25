import datetime
from decimal import Decimal

import pytest

from api.graphql.types.reservation.serializers.mixins import ReservationPriceMixin
from common.date_utils import local_datetime
from reservation_units.enums import PriceUnit
from tests.factories import ReservationUnitPricingFactory
from utils.decimal_utils import round_decimal

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_reservation__subsidised_price_is_equal_to_lowest_price__fixed_price():
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=2)

    pricing = ReservationUnitPricingFactory.create(price_unit=PriceUnit.PRICE_UNIT_FIXED)
    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == Decimal("10")
    assert prices.subsidised_price == pricing.lowest_price
    assert prices.subsidised_price_net == pricing.lowest_price_net


def test_reservation__subsidised_price_is_equal_to_lowest_price__hourly_price(graphql):
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=2)

    pricing = ReservationUnitPricingFactory(price_unit=PriceUnit.PRICE_UNIT_PER_HOUR)
    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == pricing.highest_price * 2
    assert round_decimal(prices.reservation_price_net, 6) == round_decimal(pricing.highest_price_net * 2, 6)
    assert prices.subsidised_price == pricing.lowest_price * 2
    assert round_decimal(prices.subsidised_price_net, 6) == round_decimal(pricing.lowest_price_net * 2, 6)


def test_reservation__pricing_is_calculated_per_15_min_with_pricing_type_less_than_half_day(graphql):
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=1, minutes=15)

    pricing = ReservationUnitPricingFactory(
        price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
        lowest_price=Decimal("40.0"),
        highest_price=Decimal("40.0"),
    )

    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == pricing.lowest_price * Decimal("1.25")
    assert round_decimal(prices.reservation_price_net, 6) == round_decimal(
        pricing.lowest_price_net * Decimal("1.25"), 6
    )


def test_reservation__pricing_is_fixed_with_pricing_type_more_than_half_day(graphql):
    begin = local_datetime()
    end = begin + datetime.timedelta(hours=14)

    pricing = ReservationUnitPricingFactory(
        price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
        lowest_price=Decimal("100.0"),
        highest_price=Decimal("100.0"),
    )

    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == pricing.lowest_price
    assert prices.reservation_price_net == pricing.lowest_price_net


def test_reservation__pricing_is_fixed_even_when_duration_is_double_the_pricing_unit(graphql):
    begin = local_datetime()
    end = begin + datetime.timedelta(days=1)

    pricing = ReservationUnitPricingFactory(
        price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
        lowest_price=Decimal("100.0"),
        highest_price=Decimal("100.0"),
    )

    prices = ReservationPriceMixin().calculate_price(begin, end, [pricing.reservation_unit])

    assert prices.reservation_price == pricing.lowest_price
    assert prices.reservation_price_net == pricing.lowest_price_net
