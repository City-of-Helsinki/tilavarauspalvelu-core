from datetime import datetime
from decimal import Decimal
from uuid import uuid4

import factory
from django.utils.timezone import get_default_timezone

from merchants.verkkokauppa.order.types import Order, OrderCustomer

from ._base import GenericFactory

__all__ = [
    "OrderFactory",
    "OrderCustomerFactory",
]


class OrderFactory(GenericFactory[Order]):
    class Meta:
        model = Order

    order_id = uuid4()
    namespace = "tilavaraus"
    user = str(uuid4())
    created_at = datetime.now(tz=get_default_timezone())
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
