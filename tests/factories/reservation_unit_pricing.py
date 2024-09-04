import datetime
from decimal import Decimal

import factory

from reservation_units.enums import PriceUnit
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
    price_unit = PriceUnit.PRICE_UNIT_PER_15_MINS
    lowest_price = Decimal("5")
    highest_price = Decimal("10")
    tax_percentage = factory.SubFactory("tests.factories.TaxPercentageFactory")
    reservation_unit = factory.SubFactory("tests.factories.ReservationUnitFactory")

    @classmethod
    def create_free(cls, **kwargs) -> ReservationUnitPricing:
        kwargs.setdefault("lowest_price", Decimal(0))
        kwargs.setdefault("highest_price", Decimal(0))
        kwargs.setdefault("tax_percentage__value", Decimal(0))

        return cls.create(**kwargs)
