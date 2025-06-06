from __future__ import annotations

import datetime
import uuid
from decimal import Decimal
from typing import Any

import pytest
from django.conf import settings

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import ParseOrderError
from tilavarauspalvelu.integrations.verkkokauppa.order.types import (
    CreateOrderParams,
    Order,
    OrderCustomer,
    OrderItem,
    OrderItemMeta,
    OrderItemMetaParams,
    OrderItemParams,
    WebShopOrderStatus,
)

from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

create_order_params: CreateOrderParams = CreateOrderParams(
    namespace="test-namespace",
    user=uuid.uuid4(),
    language="fi",
    price_net=Decimal("100.0"),
    price_vat=Decimal("24.0"),
    price_total=Decimal("124.0"),
    last_valid_purchase_datetime=datetime.datetime(2022, 11, 24, 12, 0, 0, tzinfo=datetime.UTC),
    items=[
        OrderItemParams(
            product_id=uuid.UUID("306ab20a-6b30-3ce3-95e8-fef818e6c30e"),
            product_name="Test Product Name",
            quantity=1,
            unit="pcs",
            row_price_net=Decimal(100),
            row_price_vat=Decimal(24),
            row_price_total=Decimal(124),
            price_net=Decimal(100),
            price_gross=Decimal(124),
            price_vat=Decimal(24),
            vat_percentage=Decimal(24),
            invoicing_date=None,
            meta=[
                OrderItemMetaParams(
                    key="firstKey",
                    value="First Test Value",
                    label="First Test Label",
                    visible_in_checkout=False,
                    ordinal="1",
                ),
                OrderItemMetaParams(
                    key="secondKey",
                    value="Second Test Value",
                    label="Second Test Label",
                    visible_in_checkout=True,
                    ordinal="2",
                ),
            ],
        )
    ],
    customer=OrderCustomer(
        first_name="John",
        last_name="Doe",
        email="john.doe@example.com",
        phone="+358123456789",
    ),
)

create_order_response: dict[str, Any] = {
    "orderId": "79ccf2c7-afcf-3e49-80bd-38867c586f8f",
    "createdAt": "2021-11-12T12:40:41.873597",
    "namespace": "test-namespace",
    "user": "test-user",
    "items": [
        {
            "orderItemId": "10e64522-bc1b-4758-b8c0-14d42e0719d4",
            "orderId": "79ccf2c7-afcf-3e49-80bd-38867c586f8f",
            "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
            "productName": "Test Product Name",
            "unit": "pcs",
            "quantity": 1,
            "rowPriceNet": "100",
            "rowPriceVat": "24",
            "rowPriceTotal": "124",
            "vatPercentage": "24",
            "priceNet": "100",
            "priceVat": "24",
            "priceGross": "124",
            "periodFrequency": None,
            "periodUnit": None,
            "periodCount": None,
            "startDate": None,
            "billingStartDate": None,
            "meta": [
                {
                    "orderItemMetaId": "60f1949a-e2c8-497c-b9d4-c1ae61d20973",
                    "orderItemId": "10e64522-bc1b-4758-b8c0-14d42e0719d4",
                    "orderId": "79ccf2c7-afcf-3e49-80bd-38867c586f8f",
                    "key": "testKey",
                    "value": "Test Value",
                    "label": "Test Label",
                    "visibleInCheckout": "false",
                    "ordinal": "1",
                }
            ],
        }
    ],
    "customer": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "phone": "+358123456789",
    },
    "status": "draft",
    "type": "order",
    "subscriptionId": None,
    "checkoutUrl": "http://localhost:1234/79ccf2c7-afcf-3e49-80bd-38867c586f8f",
    "receiptUrl": "http://localhost:1234/c1c55d55-4ef6-4a4c-8195-4f5022ad8ed8",
    "loggedInCheckoutUrl": "http://localhost:1234/79ccf2c7-afcf-3e49-80bd-38867c586f8f",
    "priceNet": "100",
    "priceVat": "24",
    "priceTotal": "124",
}


def test_verkkokauppa__order_types__create_order_params__to_json():
    json = create_order_params.to_json()
    assert json == {
        "namespace": "test-namespace",
        "user": str(create_order_params.user),
        "language": "fi",
        "lastValidPurchaseDateTime": "2022-11-24T12:00:00",
        "priceNet": "100.0",
        "priceVat": "24.0",
        "priceTotal": "124.0",
        "items": [
            {
                "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
                "quantity": 1,
                "productName": "Test Product Name",
                "unit": "pcs",
                "rowPriceNet": "100",
                "rowPriceVat": "24",
                "rowPriceTotal": "124",
                "vatPercentage": "24.0",
                "priceNet": "100",
                "priceVat": "24",
                "priceGross": "124",
                "meta": [
                    {
                        "key": "firstKey",
                        "value": "First Test Value",
                        "label": "First Test Label",
                        "visibleInCheckout": False,
                        "ordinal": "1",
                    },
                    {
                        "key": "secondKey",
                        "value": "Second Test Value",
                        "label": "Second Test Label",
                        "visibleInCheckout": True,
                        "ordinal": "2",
                    },
                ],
            }
        ],
        "customer": {
            "firstName": "John",
            "lastName": "Doe",
            "email": "john.doe@example.com",
            "phone": "+358123456789",
        },
    }


def test_verkkokauppa__order_types__order__from_json():
    order = Order.from_json(create_order_response)
    assert order == Order(
        order_id=uuid.UUID("79ccf2c7-afcf-3e49-80bd-38867c586f8f"),
        namespace="test-namespace",
        user="test-user",
        created_at=datetime.datetime(2021, 11, 12, 12, 40, 41, 873597, tzinfo=settings.VERKKOKAUPPA_TIMEZONE),
        items=[
            OrderItem(
                order_item_id=uuid.UUID("10e64522-bc1b-4758-b8c0-14d42e0719d4"),
                order_id=uuid.UUID("79ccf2c7-afcf-3e49-80bd-38867c586f8f"),
                product_id=uuid.UUID("306ab20a-6b30-3ce3-95e8-fef818e6c30e"),
                product_name="Test Product Name",
                quantity=1,
                unit="pcs",
                row_price_net=Decimal(100),
                row_price_vat=Decimal(24),
                row_price_total=Decimal(124),
                price_net=Decimal(100),
                price_gross=Decimal(124),
                price_vat=Decimal(24),
                vat_percentage=Decimal(24),
                meta=[
                    OrderItemMeta(
                        order_item_meta_id=uuid.UUID("60f1949a-e2c8-497c-b9d4-c1ae61d20973"),
                        order_item_id=uuid.UUID("10e64522-bc1b-4758-b8c0-14d42e0719d4"),
                        order_id=uuid.UUID("79ccf2c7-afcf-3e49-80bd-38867c586f8f"),
                        key="testKey",
                        value="Test Value",
                        label="Test Label",
                        visible_in_checkout=False,
                        ordinal="1",
                    )
                ],
                period_frequency=None,
                period_unit=None,
                period_count=None,
                start_date=None,
                billing_start_date=None,
            )
        ],
        price_net=Decimal(100),
        price_vat=Decimal(24),
        price_total=Decimal(124),
        checkout_url="http://localhost:1234/79ccf2c7-afcf-3e49-80bd-38867c586f8f",
        receipt_url="http://localhost:1234/c1c55d55-4ef6-4a4c-8195-4f5022ad8ed8",
        customer=OrderCustomer(
            first_name="John",
            last_name="Doe",
            email="john.doe@example.com",
            phone="+358123456789",
        ),
        status=WebShopOrderStatus.DRAFT,
        subscription_id=None,
        type="order",
    )


@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__order_types__order__from_json__raises_exception_if_key_is_missing():
    response = create_order_response.copy()
    response.pop("orderId")
    with pytest.raises(ParseOrderError):
        Order.from_json(response)

    assert SentryLogger.log_exception.call_count == 1


@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__order_types__order__from_json__raises_exception_if_value_is_invalid():
    response = create_order_response.copy()
    response["orderId"] = "invalid-order-id"
    with pytest.raises(ParseOrderError):
        Order.from_json(response)

    assert SentryLogger.log_exception.call_count == 1
