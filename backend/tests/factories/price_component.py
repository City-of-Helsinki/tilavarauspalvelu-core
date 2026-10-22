from __future__ import annotations

import datetime
from decimal import Decimal

from tilavarauspalvelu.enums import PaymentType, PriceComponentKind, PriceUnit
from tilavarauspalvelu.models import PriceComponent

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "PriceComponentFactory",
]


class PriceComponentFactory(GenericDjangoModelFactory[PriceComponent]):
    class Meta:
        model = PriceComponent

    pricing_group = ForeignKeyFactory("tests.factories.PricingGroupFactory", required=True)
    kind = PriceComponentKind.BASE

    valid_from = datetime.date(2021, 1, 1)
    valid_until = None

    price_option = ForeignKeyFactory("tests.factories.PriceOptionFactory")

    amount = Decimal(10)
    price_unit = PriceUnit.PER_HOUR

    accounting = ForeignKeyFactory("tests.factories.PaymentAccountingFactory")

    can_apply_for_discount = False
    material_price_description = ""
    payment_type = PaymentType.ONLINE

    @classmethod
    def create_free(cls, **kwargs) -> PriceComponent:
        kwargs.setdefault("amount", Decimal(0))
        kwargs.setdefault("payment_type", None)
        return cls.create(**kwargs)
