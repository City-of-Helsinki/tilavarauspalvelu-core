import datetime
from decimal import Decimal

from tilavarauspalvelu.enums import PriceUnit, PricingStatus, PricingType
from tilavarauspalvelu.models import ReservationUnitPricing

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "ReservationUnitPricingFactory",
]


class ReservationUnitPricingFactory(GenericDjangoModelFactory[ReservationUnitPricing]):
    class Meta:
        model = ReservationUnitPricing

    begins = datetime.date(2021, 1, 1)
    pricing_type = PricingType.PAID
    price_unit = PriceUnit.PRICE_UNIT_PER_15_MINS
    status = PricingStatus.PRICING_STATUS_ACTIVE

    lowest_price = Decimal("5")
    highest_price = Decimal("10")

    tax_percentage = ForeignKeyFactory("tests.factories.TaxPercentageFactory")
    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory", required=True)
