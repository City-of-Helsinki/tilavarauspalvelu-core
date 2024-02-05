from datetime import date

import factory

from reservation_units.enums import PriceUnit, PricingStatus, PricingType
from reservation_units.models import ReservationUnitPricing
from tests.factories._base import GenericDjangoModelFactory

__all__ = [
    "ReservationUnitPricingFactory",
]


class ReservationUnitPricingFactory(GenericDjangoModelFactory[ReservationUnitPricing]):
    begins = date(2021, 1, 1)
    pricing_type = PricingType.PAID
    price_unit = PriceUnit.PRICE_UNIT_PER_15_MINS
    lowest_price = 5
    highest_price = 10
    tax_percentage = factory.SubFactory("tests.factories.TaxPercentageFactory")
    status = PricingStatus.PRICING_STATUS_ACTIVE

    class Meta:
        model = ReservationUnitPricing
