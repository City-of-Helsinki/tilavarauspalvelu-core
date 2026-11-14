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

    reservation_units = ReverseForeignKeyFactory("tests.factories.ReservationUnitFactory")
