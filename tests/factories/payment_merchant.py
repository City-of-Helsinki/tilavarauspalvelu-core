from __future__ import annotations

import uuid

import factory

from tilavarauspalvelu.models import PaymentMerchant

from ._base import FakerFI, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "PaymentMerchantFactory",
]


class PaymentMerchantFactory(GenericDjangoModelFactory[PaymentMerchant]):
    class Meta:
        model = PaymentMerchant

    id = factory.LazyFunction(uuid.uuid4)
    name = FakerFI("company")

    products = ReverseForeignKeyFactory("tests.factories.PaymentProductFactory")
    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
    units = ReverseForeignKeyFactory("tests.factories.UnitFactory")
