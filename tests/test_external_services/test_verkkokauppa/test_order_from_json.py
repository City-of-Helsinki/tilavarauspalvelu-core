import uuid
from datetime import datetime
from decimal import Decimal

from django.conf import settings

from merchants.verkkokauppa.order.types import Order

order_json = {
    "orderId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
    "namespace": "tilavaraus",
    "user": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
    "createdAt": "2021-02-25T10:22:59.000",
    "items": [
        {
            "orderItemId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
            "orderId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
            "productId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
            "productName": "Tilavarauspalvelu",
            "quantity": 1,
            "unit": "pcs",
            "rowPriceNet": "10",
            "rowPriceVat": "2.4",
            "rowPriceTotal": "12.4",
            "priceNet": "10",
            "priceGross": "12.4",
            "priceVat": "2.4",
            "vatPercentage": "24",
            "meta": [
                {
                    "orderItemMetaId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
                    "orderItemId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
                    "orderId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
                    "key": "reservation_id",
                    "value": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
                    "label": "Varaus",
                    "visible_in_checkout": True,
                    "ordinal": "1",
                }
            ],
            "periodFrequency": None,
            "periodUnit": None,
            "periodCount": None,
            "startDate": None,
            "billingStartDate": None,
        }
    ],
    "priceNet": "10",
    "priceVat": "2.4",
    "priceTotal": "12.4",
    "checkoutUrl": "https://checkout.url",
    "receiptUrl": "https://receipt.url",
    "loggedInCheckoutUrl": "https://checkout.url",
    "customer": {"firstName": "Foo", "lastName": "Bar", "email": "", "phone": "123456"},
    "status": "pending",
    "subscriptionId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
    "type": "reservation",
}


def test_order_from_json():
    order = Order.from_json(order_json)
    assert order.order_id == uuid.UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
    assert order.namespace == "tilavaraus"
    assert order.user == "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6"
    assert order.created_at == datetime(2021, 2, 25, 10, 22, 59, tzinfo=settings.VERKKOKAUPPA_TIMEZONE)
    assert order.items[0].order_item_id == uuid.UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
    assert order.items[0].order_id == uuid.UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
    assert order.items[0].product_id == uuid.UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
    assert order.items[0].product_name == "Tilavarauspalvelu"
    assert order.items[0].quantity == 1
    assert order.items[0].unit == "pcs"
    assert order.items[0].row_price_net == Decimal("10")
    assert order.items[0].row_price_vat == Decimal("2.4")
    assert order.items[0].row_price_total == Decimal("12.4")
    assert order.items[0].price_net == Decimal("10")
    assert order.items[0].price_gross == Decimal("12.4")
    assert order.items[0].price_vat == Decimal("2.4")
    assert order.items[0].vat_percentage == Decimal("24")
    assert order.items[0].meta[0].order_item_meta_id == uuid.UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
    assert order.subscription_id == uuid.UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")


def test_order_from_json__missing_fields__phone():
    data = order_json.copy()
    data["customer"].pop("phone")
    order = Order.from_json(data)

    assert order.customer.phone == ""


def test_order_from_json__missing_fields__subscription_id():
    data = order_json.copy()
    data.pop("subscriptionId")
    order = Order.from_json(data)

    assert order.subscription_id is None
