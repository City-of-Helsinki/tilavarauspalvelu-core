import uuid
from decimal import Decimal
from typing import Self

import factory
from django.conf import settings
from django.urls import reverse

from tilavarauspalvelu.enums import Language, OrderStatus, PaymentType
from tilavarauspalvelu.models import PaymentOrder, Reservation

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ModelFactoryBuilder

__all__ = [
    "PaymentOrderBuilder",
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


class PaymentOrderBuilder(ModelFactoryBuilder[PaymentOrder]):
    factory = PaymentOrderFactory

    def for_mock_order(self, reservation: Reservation) -> Self:
        order_uuid = uuid.uuid4()
        base_url = settings.MOCK_VERKKOKAUPPA_BACKEND_URL.strip("/")
        checkout_url = reverse("mock_verkkokauppa:checkout", args=[order_uuid]).strip("/")
        receipt_url = reverse("admin:tilavarauspalvelu_reservation_change", args=[reservation.id]).strip("/")

        return self.set(
            remote_id=order_uuid,
            checkout_url=f"{base_url}/{checkout_url}/",
            receipt_url=f"{base_url}/{receipt_url}/?",
        )
