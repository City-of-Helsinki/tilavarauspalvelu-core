import uuid
from decimal import Decimal

import factory

from tilavarauspalvelu.enums import Language, OrderStatus, PaymentType
from tilavarauspalvelu.models import PaymentOrder

from ._base import ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "PaymentOrderFactory",
]


class PaymentOrderFactory(GenericDjangoModelFactory[PaymentOrder]):
    class Meta:
        model = PaymentOrder

    reservation = ForeignKeyFactory("tests.factories.ReservationFactory")

    remote_id = factory.LazyFunction(uuid.uuid4)
    payment_id = ""  # uuid.UUID
    refund_id = None  # uuid.UUID
    payment_type = PaymentType.INVOICE
    status = OrderStatus.DRAFT

    price_net = Decimal("10.0")
    price_vat = Decimal("2.0")
    price_total = Decimal("12.0")

    processed_at = None
    language = Language.FI
    reservation_user_uuid = None
    checkout_url = ""
    receipt_url = ""
