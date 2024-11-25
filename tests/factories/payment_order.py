from __future__ import annotations

import uuid
from decimal import Decimal
from typing import TYPE_CHECKING, Self

import factory
from django.conf import settings
from django.urls import reverse

from tilavarauspalvelu.enums import Language, OrderStatus, PaymentType
from tilavarauspalvelu.models import PaymentOrder

from ._base import ForeignKeyFactory, GenericDjangoModelFactory, ModelFactoryBuilder

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation

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

        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            base_url = settings.MOCK_VERKKOKAUPPA_BACKEND_URL.strip("/")

            checkout_path = reverse("mock_verkkokauppa:checkout", args=[order_uuid]).strip("/")
            receipt_path = reverse("admin:tilavarauspalvelu_reservation_change", args=[reservation.id]).strip("/")

            checkout_url = f"{base_url}/{checkout_path}/"
            receipt_url = f"{base_url}/{receipt_path}/?"

        else:
            checkout_url = f"https://checkout-test.test.hel.ninja/{order_uuid}?user={reservation.user.uuid}"
            receipt_url = f"https://checkout-test.test.hel.ninja/{order_uuid}/receipt?user={reservation.user.uuid}"

        return self.set(
            remote_id=order_uuid,
            checkout_url=checkout_url,
            receipt_url=receipt_url,
        )
