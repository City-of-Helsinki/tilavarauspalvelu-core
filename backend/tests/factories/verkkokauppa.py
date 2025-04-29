from __future__ import annotations

import uuid
from decimal import Decimal

import factory
from factory import LazyFunction

from tilavarauspalvelu.integrations.verkkokauppa.order.types import Order, OrderCustomer, WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import (
    Payment,
    WebShopPaymentGateway,
    WebShopPaymentStatus,
)
from utils.date_utils import local_datetime

from ._base import GenericFactory

__all__ = [
    "OrderCustomerFactory",
    "OrderFactory",
    "Payment",
]


class OrderFactory(GenericFactory[Order]):
    class Meta:
        model = Order

    order_id = LazyFunction(uuid.uuid4)
    namespace = "tilavaraus"
    user = LazyFunction(lambda: str(uuid.uuid4()))
    created_at = LazyFunction(local_datetime)
    items = []
    price_net = Decimal("10.0")
    price_vat = Decimal("2.4")
    price_total = price_net + price_vat
    checkout_url = "https://checkout.url"
    receipt_url = "https://receipt.url"
    status = WebShopOrderStatus.DRAFT.value
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

    payment_id = LazyFunction(uuid.uuid4)
    namespace = "tilanvaraus"
    order_id = LazyFunction(uuid.uuid4)
    user_id = LazyFunction(uuid.uuid4)
    status = WebShopPaymentStatus.CREATED.value
    payment_method = "creditcards"
    payment_type = "order"
    total_excl_tax = Decimal(100)
    total = Decimal(124)
    tax_amount = Decimal(24)
    description = "Mock description"
    additional_info = '{"payment_method": creditcards}'
    token = LazyFunction(uuid.uuid4)
    timestamp = LazyFunction(local_datetime)
    payment_method_label = "Visa"
    payment_gateway = WebShopPaymentGateway.PAYTRAIL.value
