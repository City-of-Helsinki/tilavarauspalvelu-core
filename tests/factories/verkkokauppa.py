from __future__ import annotations

import datetime
import uuid
from decimal import Decimal

import factory
from django.utils.timezone import get_default_timezone

from tilavarauspalvelu.integrations.verkkokauppa.order.types import Order, OrderCustomer
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import Payment

from ._base import GenericFactory

__all__ = [
    "OrderCustomerFactory",
    "OrderFactory",
    "Payment",
]


class OrderFactory(GenericFactory[Order]):
    class Meta:
        model = Order

    order_id = uuid.uuid4()
    namespace = "tilavaraus"
    user = str(uuid.uuid4())
    created_at = datetime.datetime.now(tz=get_default_timezone())
    items = []
    price_net = Decimal("10.0")
    price_vat = Decimal("2.4")
    price_total = price_net + price_vat
    checkout_url = "https://checkout.url"
    receipt_url = "https://receipt.url"
    status = "draft"
    type = "order"
    subscription_id = None
    customer = factory.SubFactory("tests.factories.OrderCustomerFactory")


class OrderCustomerFactory(GenericFactory[OrderCustomer]):
    class Meta:
        model = OrderCustomer

    first_name = "Foo"
    last_name = "Bar"
    email = "foo.bar@email.com"
    phone = "+358 50 123 4567"


class PaymentFactory(GenericFactory[Payment]):
    class Meta:
        model = Payment

    payment_id = uuid.uuid4()
    namespace = "tilanvaraus"
    order_id = uuid.uuid4()
    user_id = uuid.uuid4()
    status = "payment_created"
    payment_method = "creditcards"
    payment_type = "order"
    total_excl_tax = Decimal(100)
    total = Decimal(124)
    tax_amount = Decimal(24)
    description = "Mock description"
    additional_info = '{"payment_method": creditcards}'
    token = uuid.uuid4()
    timestamp = datetime.datetime.now(tz=get_default_timezone())
    payment_method_label = "Visa"
