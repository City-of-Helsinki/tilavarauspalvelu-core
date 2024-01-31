import datetime
from decimal import Decimal

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from api.graphql.types.reservations.serializers.mixins import ReservationPriceMixin
from common.date_utils import local_datetime
from reservation_units.enums import PriceUnit, PricingStatus, PricingType
from reservation_units.models import ReservationUnitPricing
from tests.factories import ReservationUnitPricingFactory
from utils.decimal_utils import round_decimal


class ReservationPricingTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation_unit.allow_reservations_without_opening_hours = True
        cls.reservation_unit.save()

    def test_reservation_subsidised_price_is_equal_to_lowest_price(self):
        begin = local_datetime()
        end = begin + datetime.timedelta(hours=2)

        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=datetime.date.today(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_FIXED,
            lowest_price=Decimal("1.0"),
            highest_price=Decimal("3.0"),
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )
        prices = ReservationPriceMixin().calculate_price(begin, end, [self.reservation_unit])

        assert prices.reservation_price == Decimal("3")
        assert prices.subsidised_price == pricing.lowest_price
        assert prices.subsidised_price_net == pricing.lowest_price_net

    def test_reservation_subsidised_price_is_equal_to_lowest_price_time_based_calc(self):
        begin = local_datetime()
        end = begin + datetime.timedelta(hours=2)

        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
            lowest_price=Decimal("1.0"),
            highest_price=Decimal("3.0"),
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        prices = ReservationPriceMixin().calculate_price(begin, end, [self.reservation_unit])

        assert prices.reservation_price == pricing.highest_price * 2
        assert round_decimal(prices.reservation_price_net, 6) == round_decimal(pricing.highest_price_net * 2, 6)
        assert prices.subsidised_price == pricing.lowest_price * 2
        assert round_decimal(prices.subsidised_price_net, 6) == round_decimal(pricing.lowest_price_net * 2, 6)

    def test_pricing_is_calculated_per_15mins_with_pricing_type_less_than_half_day(self):
        begin = local_datetime()
        end = begin + datetime.timedelta(hours=1, minutes=15)

        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HOUR,
            lowest_price=Decimal("40.0"),
            highest_price=Decimal("40.0"),
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        prices = ReservationPriceMixin().calculate_price(begin, end, [self.reservation_unit])

        assert prices.reservation_price == pricing.lowest_price * Decimal("1.25")
        assert round_decimal(prices.reservation_price_net, 6) == round_decimal(
            pricing.lowest_price_net * Decimal("1.25"), 6
        )

    def test_pricing_is_fixed_with_pricing_type_more_than_half_day(self):
        begin = local_datetime()
        end = begin + datetime.timedelta(hours=14)

        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
            lowest_price=Decimal("100.0"),
            highest_price=Decimal("100.0"),
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        prices = ReservationPriceMixin().calculate_price(begin, end, [self.reservation_unit])

        assert prices.reservation_price == pricing.lowest_price
        assert prices.reservation_price_net == pricing.lowest_price_net

    def test_pricing_is_fixed_even_when_duration_is_double_the_ricing_unit(self):
        begin = local_datetime()
        end = begin + datetime.timedelta(days=1)

        pricing: ReservationUnitPricing = ReservationUnitPricingFactory(
            begins=begin.date(),
            pricing_type=PricingType.PAID,
            price_unit=PriceUnit.PRICE_UNIT_PER_HALF_DAY,
            lowest_price=Decimal("100.0"),
            highest_price=Decimal("100.0"),
            status=PricingStatus.PRICING_STATUS_ACTIVE,
            reservation_unit=self.reservation_unit,
        )

        prices = ReservationPriceMixin().calculate_price(begin, end, [self.reservation_unit])

        assert prices.reservation_price == pricing.lowest_price
        assert prices.reservation_price_net == pricing.lowest_price_net
