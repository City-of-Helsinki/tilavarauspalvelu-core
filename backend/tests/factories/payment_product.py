from __future__ import annotations

import uuid

import factory

from tilavarauspalvelu.models import PaymentProduct

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "PaymentProductFactory",
]


class PaymentProductFactory(GenericDjangoModelFactory[PaymentProduct]):
    class Meta:
        model = PaymentProduct

    id = factory.LazyFunction(uuid.uuid4)

    merchant = ForeignKeyFactory("tests.factories.PaymentMerchantFactory")
    reservation_unit = ForeignKeyFactory("tests.factories.ReservationUnitFactory", required=True)
    sales_item = ForeignKeyFactory("tests.factories.SalesItemFactory")

    reservation_price_lines = ReverseForeignKeyFactory("tests.factories.ReservationPriceLineFactory")
