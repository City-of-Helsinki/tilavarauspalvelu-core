import datetime
from decimal import Decimal

import factory

from reservation_units.enums import PriceUnit, PricingType
from reservation_units.models import ReservationUnitPricing

from ._base import GenericDjangoModelFactory

__all__ = [
    "ReservationUnitPricingFactory",
]


class ReservationUnitPricingFactory(GenericDjangoModelFactory[ReservationUnitPricing]):
    class Meta:
        model = ReservationUnitPricing

    begins = datetime.date(2021, 1, 1)
    is_activated_on_begins = False
    pricing_type = PricingType.PAID
    price_unit = PriceUnit.PRICE_UNIT_PER_15_MINS
    lowest_price = Decimal("5")
    highest_price = Decimal("10")
    tax_percentage = factory.SubFactory("tests.factories.TaxPercentageFactory")
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")
