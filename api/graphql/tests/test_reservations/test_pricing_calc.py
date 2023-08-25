import datetime
from decimal import Decimal

from assertpy import assert_that
from django.utils.timezone import get_default_timezone, utc

from api.graphql.reservations.reservation_serializers.mixins import (
    ReservationPriceMixin,
)
from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from reservation_units.models import PriceUnit, PricingStatus, PricingType
from reservation_units.tests.factories import (
    ReservationUnitPricingFactory,
    TaxPercentageFactory,
)


class ReservationPricingTestCase(ReservationTestCaseBase):
    def test_reservation_subsidised_price_is_equal_to_lowest_price(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()
        pricing = ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=Decimal("1.0"),
            highest_price=Decimal("3.0"),
            lowest_price_net=Decimal("1") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("3") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        begin = datetime.datetime.now(tz=get_default_timezone())
        end = begin + datetime.timedelta(hours=2)

        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])

        assert_that(prices.reservation_price).is_equal_to(Decimal("3"))
        assert_that(prices.subsidised_price).is_equal_to(pricing.lowest_price)
        assert_that(prices.subsidised_price_net).is_close_to(pricing.lowest_price_net, 6)

    def test_reservation_subsidised_price_is_equal_to_lowest_price_time_based_calc(
        self,
    ):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()
        pricing = ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
            lowest_price=Decimal("1.0"),
            highest_price=Decimal("3.0"),
            lowest_price_net=Decimal("1") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("3") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        begin = datetime.datetime(2022, 12, 23, 15, 0).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(hours=2)

        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])

        assert_that(prices.reservation_price).is_close_to(pricing.highest_price * Decimal("2"), 6)
        assert_that(prices.subsidised_price).is_close_to(pricing.lowest_price * Decimal("2"), 6)
        assert_that(prices.subsidised_price_net).is_close_to(pricing.lowest_price_net * Decimal("2"), 6)

    def test_pricing_is_calculated_per_15mins_with_pricing_type_less_than_half_day(
        self,
    ):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory(value=Decimal("0.0"))
        begin = datetime.datetime.now(tz=utc).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(hours=1, minutes=15)

        pricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
            lowest_price=Decimal("40.0"),
            highest_price=Decimal("40.0"),
            lowest_price_net=Decimal("40.0") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("40.0") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])
        assert_that(prices.reservation_price).is_close_to(pricing.lowest_price * Decimal("1.25"), 6)

    def test_pricing_is_fixed_with_pricing_type_more_than_half_day(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory(value=Decimal("0.0"))
        begin = datetime.datetime.now(tz=utc).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(hours=14)

        pricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
            lowest_price=Decimal("100.0"),
            highest_price=Decimal("100.0"),
            lowest_price_net=Decimal("100.0") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("100.0") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])
        assert_that(prices.reservation_price).is_close_to(pricing.lowest_price, 6)

    def test_pricing_is_fixed_even_when_duration_is_double_the_pricing_unit(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory(value=Decimal("0.0"))
        begin = datetime.datetime.now(tz=utc).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(days=1)

        pricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
            lowest_price=Decimal("100.0"),
            highest_price=Decimal("100.0"),
            lowest_price_net=Decimal("100.0") / (1 + tax_percentage.decimal),
            highest_price_net=Decimal("100.0") / (1 + tax_percentage.decimal),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])
        assert_that(prices.reservation_price).is_close_to(pricing.lowest_price, 6)
