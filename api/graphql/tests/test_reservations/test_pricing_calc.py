import datetime
from decimal import Decimal

from assertpy import assert_that
from django.utils.timezone import get_default_timezone

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
        assert_that(prices.subsidised_price_net).is_close_to(
            pricing.lowest_price_net, 6
        )

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
        begin = datetime.datetime(2022, 12, 23, 15, 0).astimezone(
            get_default_timezone()
        )
        end = begin + datetime.timedelta(hours=2)

        prices = price_calc.calculate_price(begin, end, [self.reservation_unit])

        assert_that(prices.reservation_price).is_close_to(
            pricing.highest_price * Decimal("2"), 6
        )
        assert_that(prices.subsidised_price).is_close_to(
            pricing.lowest_price * Decimal("2"), 6
        )
        assert_that(prices.subsidised_price_net).is_close_to(
            pricing.lowest_price_net * Decimal("2"), 6
        )
