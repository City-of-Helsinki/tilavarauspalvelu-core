from __future__ import annotations

from decimal import Decimal

from tilavarauspalvelu.enums import PriceUnit
from tilavarauspalvelu.models import ReservationPriceLine

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "ReservationPriceLineFactory",
]


class ReservationPriceLineFactory(GenericDjangoModelFactory[ReservationPriceLine]):
    class Meta:
        model = ReservationPriceLine

    reservation = ForeignKeyFactory("tests.factories.ReservationFactory", required=True)
    price_component = ForeignKeyFactory("tests.factories.PriceComponentFactory")

    description = ""

    quantity = Decimal(1)
    price_unit = PriceUnit.PER_HOUR

    unit_amount = Decimal(10)
    amount_before_adjustment = Decimal(10)
    adjustment_percentage = Decimal(0)
    amount = Decimal(10)
    override_amount = None

    tax_level = ForeignKeyFactory("tests.factories.TaxLevelFactory", required=True)
    tax_percentage = Decimal(0)
    vat_code = ""

    payment_product = ForeignKeyFactory("tests.factories.PaymentProductFactory")
