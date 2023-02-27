from datetime import datetime
from decimal import Decimal
from uuid import UUID

from assertpy import assert_that
from django.test import TestCase

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
                    "ordinal": 1,
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
    "customer": {"firstName": "Foo", "lastName": "Bar", "email": "", "phone": "123456"},
    "status": "pending",
    "subscriptionId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
    "type": "reservation",
}


class OrderFromJsonTestCase(TestCase):
    def test_order_from_json(self):
        order = Order.from_json(order_json)
        assert_that(order.order_id).is_equal_to(
            UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
        )
        assert_that(order.namespace).is_equal_to("tilavaraus")
        assert_that(order.user).is_equal_to("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
        assert_that(order.created_at).is_equal_to(datetime(2021, 2, 25, 10, 22, 59))
        assert_that(order.items[0].order_item_id).is_equal_to(
            UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
        )
        assert_that(order.items[0].order_id).is_equal_to(
            UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
        )
        assert_that(order.items[0].product_id).is_equal_to(
            UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
        )
        assert_that(order.items[0].product_name).is_equal_to("Tilavarauspalvelu")
        assert_that(order.items[0].quantity).is_equal_to(1)
        assert_that(order.items[0].unit).is_equal_to("pcs")
        assert_that(order.items[0].row_price_net).is_equal_to(Decimal("10"))
        assert_that(order.items[0].row_price_vat).is_equal_to(Decimal("2.4"))
        assert_that(order.items[0].row_price_total).is_equal_to(Decimal("12.4"))
        assert_that(order.items[0].price_net).is_equal_to(Decimal("10"))
        assert_that(order.items[0].price_gross).is_equal_to(Decimal("12.4"))
        assert_that(order.items[0].price_vat).is_equal_to(Decimal("2.4"))
        assert_that(order.items[0].vat_percentage).is_equal_to(Decimal("24"))
        assert_that(order.items[0].meta[0].order_item_meta_id).is_equal_to(
            UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6"),
        )
        assert_that(order.subscription_id).is_equal_to(
            UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6"),
        )

    def test_phone_not_included(self):
        data = order_json.copy()
        data["customer"].pop("phone")
        order = Order.from_json(data)

        assert_that(order.customer.phone).is_equal_to("")

    def test_subscription_id_not_included(self):
        data = order_json.copy()
        data.pop("subscriptionId")
        order = Order.from_json(data)

        assert_that(order.subscription_id).is_none()
