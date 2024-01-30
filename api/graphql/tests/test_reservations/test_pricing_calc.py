import datetime
from decimal import Decimal

from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from api.graphql.types.reservations.serializers.mixins import ReservationPriceMixin
from reservation_units.enums import PriceUnit, PricingStatus, PricingType
from reservation_units.models import ReservationUnitPricing
from tests.factories import ReservationUnitPricingFactory, TaxPercentageFactory
from utils.decimal_utils import round_decimal


class ReservationPricingTestCase(ReservationTestCaseBase):
    def test_reservation_subsidised_price_is_equal_to_lowest_price(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()
        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=Decimal("1.0"),
            highest_price=Decimal("3.0"),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        begin = datetime.datetime.now(tz=get_default_timezone())
        end = begin + datetime.timedelta(hours=2)

        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])

        assert prices.reservation_price == Decimal("3")
        assert prices.subsidised_price == pricing.lowest_price
        assert prices.subsidised_price_net == round_decimal(pricing.lowest_price_net, 6)

    def test_reservation_subsidised_price_is_equal_to_lowest_price_time_based_calc(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory()
        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
            lowest_price=Decimal("1.0"),
            highest_price=Decimal("3.0"),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        begin = datetime.datetime(2022, 12, 23, 15, 0).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(hours=2)

        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])

        assert round_decimal(prices.reservation_price, 6) == round_decimal(pricing.highest_price * Decimal("2"), 6)
        assert prices.subsidised_price == round_decimal(pricing.lowest_price * Decimal("2"), 6)
        assert prices.subsidised_price_net == round_decimal(pricing.lowest_price_net * Decimal("2"), 6)

    def test_pricing_is_calculated_per_15mins_with_pricing_type_less_than_half_day(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory(value=Decimal("0.0"))
        begin = datetime.datetime.now(tz=datetime.UTC).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(hours=1, minutes=15)

        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
            lowest_price=Decimal("40.0"),
            highest_price=Decimal("40.0"),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])
        assert prices.reservation_price == round_decimal(pricing.lowest_price * Decimal("1.25"), 6)

    def test_pricing_is_fixed_with_pricing_type_more_than_half_day(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory(value=Decimal("0.0"))
        begin = datetime.datetime.now(tz=datetime.UTC).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(hours=14)

        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
            lowest_price=Decimal("100.0"),
            highest_price=Decimal("100.0"),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])
        assert prices.reservation_price == round_decimal(pricing.lowest_price, 6)

    def test_pricing_is_fixed_even_when_duration_is_double_the_pricing_unit(self):
        self.reservation_unit.allow_reservations_without_opening_hours = True
        self.reservation_unit.save()

        tax_percentage = TaxPercentageFactory(value=Decimal("0.0"))
        begin = datetime.datetime.now(tz=datetime.UTC).astimezone(get_default_timezone())
        end = begin + datetime.timedelta(days=1)

        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
            lowest_price=Decimal("100.0"),
            highest_price=Decimal("100.0"),
            tax_percentage=tax_percentage,
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        price_calc = ReservationPriceMixin()
        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])
        assert prices.reservation_price == round_decimal(pricing.lowest_price, 6)
