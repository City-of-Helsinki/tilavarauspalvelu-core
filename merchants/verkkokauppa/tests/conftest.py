from decimal import Decimal
from typing import Any, Dict
from uuid import UUID

from pytest import fixture

from ..order.types import (
    CreateOrderParams,
    OrderCustomer,
    OrderItemMetaParams,
    OrderItemParams,
)
from ..product.types import CreateProductParams


@fixture(autouse=True)
def setup_audit_log(settings):
    settings.VERKKOKAUPPA_API_KEY = "test-api-key"
    settings.VERKKOKAUPPA_PRODUCT_API_URL = "http://test-product:1234"
    settings.VERKKOKAUPPA_ORDER_API_URL = "http://test-order:1234"
    settings.VERKKOKAUPPA_PAYMENT_API_URL = "http://test-payment:1234"
    settings.VERKKOKAUPPA_MERCHANT_API_URL = "http://test-merchant:1234"
    settings.VERKKOKAUPPA_MERCHANT_NAMESPACE = "tilanvaraus"


@fixture
def create_product_params() -> CreateProductParams:
    return CreateProductParams(
        namespace="test-namespace",
        namespace_entity_id="test-namespace-entity-id",
        merchant_id="be4154c7-9f66-4625-998b-18abac4ecae7",
    )


@fixture
def response() -> Dict[str, str]:
    return {
        "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
        "namespace": "test-namespace",
        "namespaceEntityId": "test-namespace-entity-id",
        "merchantId": "be4154c7-9f66-4625-998b-18abac4ecae7",
    }


@fixture
def create_order_params() -> CreateOrderParams:
    return CreateOrderParams(
        namespace="test-namespace",
        user="test-user",
        items=[
            OrderItemParams(
                product_id=UUID("306ab20a-6b30-3ce3-95e8-fef818e6c30e"),
                product_name="Test Product Name",
                quantity=1,
                unit="pcs",
                row_price_net=Decimal("100"),
                row_price_vat=Decimal("24"),
                row_price_total=Decimal("124"),
                price_net=Decimal("100"),
                price_gross=Decimal("124"),
                price_vat=Decimal("24"),
                vat_percentage=Decimal("24"),
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


@fixture
def create_order_response() -> Dict[str, Any]:
    return {
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
        "priceNet": "100",
        "priceVat": "24",
        "priceTotal": "124",
    }


@fixture
def get_order_response() -> Dict[str, Any]:
    return {
        "orderId": "79ccf2c7-afcf-3e49-80bd-38867c586f8f",
        "namespace": "test-namespace",
        "user": "test-user",
        "createdAt": "2021-11-12T12:40:41.873597",
        "items": [
            {
                "orderItemId": "10e64522-bc1b-4758-b8c0-14d42e0719d4",
                "orderId": "79ccf2c7-afcf-3e49-80bd-38867c586f8f",
                "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
                "productName": "Test Product Name",
                "unit": "pcs",
                "quantity": 2,
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
        "priceNet": "100",
        "priceVat": "24",
        "priceTotal": "124",
        "isValidForCheckout": True,
        "merchant": {},
    }


@fixture
def get_payment_response() -> Dict[str, Any]:
    return {
        "paymentId": "08c2d282-eb98-3271-a3fc-81fe200f129b_at_20211115-122645",
        "namespace": "tilavarauspalvelu",
        "orderId": "08c2d282-eb98-3271-a3fc-81fe200f129b",
        "userId": "Esperanza_Daniel23",
        "status": "payment_created",
        "paymentMethod": "nordea",
        "paymentType": "order",
        "totalExclTax": 100,
        "total": 124,
        "taxAmount": 24,
        "description": "Test description",
        "additionalInfo": '{"payment_method": nordea}',
        "token": "354477a1a009a1514fa3cc1132179a60163f5650aaf27ec98bb98158b04e0a63",
        "timestamp": "20211115-122645",
        "paymentMethodLabel": "Nordea",
    }
