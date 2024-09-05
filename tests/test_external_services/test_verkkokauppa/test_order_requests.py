import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any
from urllib.parse import urljoin

import pytest
from requests import Timeout

from merchants.verkkokauppa.order.exceptions import CancelOrderError, CreateOrderError, GetOrderError
from merchants.verkkokauppa.order.types import (
    CreateOrderParams,
    Order,
    OrderCustomer,
    OrderItemMetaParams,
    OrderItemParams,
)
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tests.helpers import patch_method
from tests.mocks import MockResponse
from utils.sentry import SentryLogger

create_order_params: CreateOrderParams = CreateOrderParams(
    namespace="test-namespace",
    user="test-user",
    language="fi",
    price_net=Decimal("100.0"),
    price_vat=Decimal("24.0"),
    price_total=Decimal("124.0"),
    last_valid_purchase_datetime=datetime(2022, 11, 24, 12, 0, 0, tzinfo=UTC),
    items=[
        OrderItemParams(
            product_id=uuid.UUID("306ab20a-6b30-3ce3-95e8-fef818e6c30e"),
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

create_order_response = {
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
    "receiptUrl": "http://localhost:12344/c1c55d55-4ef6-4a4c-8195-4f5022ad8ed8",
    "loggedInCheckoutUrl": "http://localhost:1234/79ccf2c7-afcf-3e49-80bd-38867c586f8f",
    "priceNet": "100",
    "priceVat": "24",
    "priceTotal": "124",
}


get_order_response: dict[str, Any] = {
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
    "receiptUrl": "http://localhost:12344/c1c55d55-4ef6-4a4c-8195-4f5022ad8ed8",
    "loggedInCheckoutUrl": "http://localhost:1234/79ccf2c7-afcf-3e49-80bd-38867c586f8f",
    "priceNet": "100",
    "priceVat": "24",
    "priceTotal": "124",
    "isValidForCheckout": True,
    "merchant": {},
}

get_order_404_response: dict[str, Any] = {"errors": [{"code": "order-not-found", "message": "Order not found"}]}

cancel_order_response: dict[str, Any] = {
    "order": {
        "orderId": "f8477bab-26c6-38de-a74b-692e729bae05",
        "namespace": "tilanvaraus",
        "user": "657d6cfc-f048-11ec-b6f9-0ed952b261b2",
        "createdAt": "2022-11-24T05:30:18.715",
        "items": [
            {
                "merchantId": "13373e6d-85e6-4796-b1f1-caf6b67fd933",
                "orderItemId": "d975d859-d128-4b83-bb46-cad22efcf5f1",
                "orderId": "f8477bab-26c6-38de-a74b-692e729bae05",
                "productId": "d23b7c02-58a3-3333-bdee-ba238d50185b",
                "productName": "Studiohuone 1 + soittimet",
                "productLabel": None,
                "productDescription": None,
                "unit": "pcs",
                "quantity": 1,
                "rowPriceNet": "100.000000",
                "rowPriceVat": "24.00000000",
                "rowPriceTotal": "124.00000000",
                "vatPercentage": "24.00",
                "priceNet": "100.000000",
                "priceVat": "24.00000000",
                "priceGross": "124.00000000",
                "originalPriceNet": None,
                "originalPriceVat": None,
                "originalPriceGross": None,
                "periodFrequency": None,
                "periodUnit": None,
                "periodCount": None,
                "startDate": None,
                "billingStartDate": None,
                "meta": [
                    {
                        "orderItemMetaId": "3d28a712-870e-41a4-ae8d-32c04f906b0f",
                        "orderItemId": "d975d859-d128-4b83-bb46-cad22efcf5f1",
                        "orderId": "f8477bab-26c6-38de-a74b-692e729bae05",
                        "key": "namespaceProductId",
                        "value": "3bc5b647-8821-412b-89ce-2f9e88dc7d45",
                        "label": None,
                        "visibleInCheckout": "false",
                        "ordinal": "0",
                    },
                    {
                        "orderItemMetaId": "4cf984dd-65b3-4686-80c7-4fc364b41517",
                        "orderItemId": "d975d859-d128-4b83-bb46-cad22efcf5f1",
                        "orderId": "f8477bab-26c6-38de-a74b-692e729bae05",
                        "key": "reservationPeriod",
                        "value": "To 24.11.2022 05:27-05:27",
                        "label": "Varausaika",
                        "visibleInCheckout": "true",
                        "ordinal": "1",
                    },
                ],
            }
        ],
        "customer": {
            "firstName": "First",
            "lastName": "Name",
            "email": "asdasd@asdasd.fi",
            "phone": "",
        },
        "status": "cancelled",
        "type": "order",
        "subscriptionId": None,
        "invoice": None,
        "checkoutUrl": "https://localhost:1234/f8477bab-26c6-38de-a74b-692e729bae05",
        "receiptUrl": "https://localhost:1234/f8477bab-26c6-38de-a74b-692e729bae05/receiptUrl",
        "loggedInCheckoutUrl": "https://localhost:1234/profile/f8477bab-26c6-38de-a74b-692e729bae05",
        "updateCardUrl": "https://localhost:1234/f8477bab-26c6-38de-a74b-692e729bae05/update-card",
        "priceNet": "100",
        "priceVat": "24",
        "priceTotal": "124",
    },
    "cancelUrl": "https://tilavaraus.test.hel.ninja/payment/failure?orderId=f8477bab-26c6-38de-a74b-692e729bae05",
}


@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=201, json=create_order_response))
def test_verkkokauppa__create_order__makes_valid_request(settings):
    returned_value = VerkkokauppaAPIClient.create_order(order_params=create_order_params)

    VerkkokauppaAPIClient.generic.assert_called_with(
        "post",
        url=settings.VERKKOKAUPPA_ORDER_API_URL + "/",
        json=create_order_params.to_json(),
        headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
    )

    assert returned_value == Order.from_json(create_order_response)


@patch_method(VerkkokauppaAPIClient.generic)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__create_order__raises_exception_if_order_id_is_missing():
    return_value = create_order_response.copy()
    return_value.pop("orderId")

    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=201, json=return_value)

    with pytest.raises(CreateOrderError):
        VerkkokauppaAPIClient.create_order(order_params=create_order_params)

    assert SentryLogger.log_exception.call_count == 2


@patch_method(VerkkokauppaAPIClient.generic)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__create_order__raises_exception_if_order_id_is_invalid():
    return_value = create_order_response.copy()
    return_value["orderId"] = "invalid-id"

    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=201, json=return_value)

    with pytest.raises(CreateOrderError):
        VerkkokauppaAPIClient.create_order(order_params=create_order_params)

    assert SentryLogger.log_exception.call_count == 2


@patch_method(VerkkokauppaAPIClient.generic)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__create_order__raises_exception_if_logger_in_checkout_url_is_missing():
    return_value = create_order_response.copy()
    return_value.pop("loggedInCheckoutUrl")

    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=201, json=return_value)

    with pytest.raises(CreateOrderError):
        VerkkokauppaAPIClient.create_order(order_params=create_order_params)

    assert SentryLogger.log_exception.call_count == 2


@patch_method(VerkkokauppaAPIClient.generic, side_effect=Timeout())
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__create_order__raises_exception_on_timeout():
    with pytest.raises(CreateOrderError):
        VerkkokauppaAPIClient.create_order(order_params=create_order_params)

    assert SentryLogger.log_exception.call_count == 1


@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=500, json=create_order_response))
@patch_method(SentryLogger.log_message)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__create_order__raises_exception_if_status_is_500():
    with pytest.raises(CreateOrderError):
        VerkkokauppaAPIClient.create_order(order_params=create_order_params)

    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_exception.call_count == 1


@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=400, json=create_order_response))
def test_verkkokauppa__create_order__raises_exception_if_status_code_is_not_201():
    with pytest.raises(CreateOrderError):
        VerkkokauppaAPIClient.create_order(order_params=create_order_params)


@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=200, json=get_order_response))
def test_verkkokauppa__get_order__makes_valid_request(settings):
    order_uuid = uuid.UUID(get_order_response["orderId"])
    returned_value = VerkkokauppaAPIClient.get_order(order_uuid=order_uuid)

    VerkkokauppaAPIClient.generic.assert_called_with(
        "get",
        url=urljoin(settings.VERKKOKAUPPA_ORDER_API_URL, f"admin/{order_uuid}"),
        params=None,
        headers={
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        },
    )
    assert returned_value == Order.from_json(get_order_response)


@patch_method(VerkkokauppaAPIClient.generic)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__get_order__raises_exception_if_order_id_is_missing():
    return_value = get_order_response.copy()
    order_uuid = uuid.UUID(return_value.pop("orderId"))

    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=200, json=return_value)

    with pytest.raises(GetOrderError):
        VerkkokauppaAPIClient.get_order(order_uuid=order_uuid)

    assert SentryLogger.log_exception.call_count == 2


@patch_method(VerkkokauppaAPIClient.generic)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__get_order_raises_exception_if_logger_in_checkout_url_is_missing():
    return_value = get_order_response.copy()
    return_value.pop("loggedInCheckoutUrl")

    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=200, json=return_value)

    with pytest.raises(GetOrderError):
        VerkkokauppaAPIClient.get_order(order_uuid=return_value["orderId"])

    assert SentryLogger.log_exception.call_count == 2


@patch_method(VerkkokauppaAPIClient.generic, side_effect=Timeout())
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__get_order__raises_exception_on_timeout():
    with pytest.raises(GetOrderError):
        VerkkokauppaAPIClient.get_order(order_uuid=get_order_response["orderId"])

    assert SentryLogger.log_exception.call_count == 1


@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=404, json=get_order_404_response))
def test_verkkokauppa__get_order__raises_exception_on_404():
    with pytest.raises(GetOrderError) as err:
        VerkkokauppaAPIClient.get_order(order_uuid=uuid.UUID(get_order_response["orderId"]))
    assert str(err.value) == "Order not found: [{'code': 'order-not-found', 'message': 'Order not found'}]"


@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=200, json=cancel_order_response))
def test_verkkokauppa__cancel_order__makes_valid_request(settings):
    order_uuid = uuid.UUID(cancel_order_response["order"]["orderId"])
    user_uuid = cancel_order_response["order"]["user"]

    returned_value = VerkkokauppaAPIClient.cancel_order(order_uuid=order_uuid, user_uuid=user_uuid)

    VerkkokauppaAPIClient.generic.assert_called_with(
        "post",
        url=urljoin(settings.VERKKOKAUPPA_ORDER_API_URL, f"{order_uuid}/cancel"),
        json=None,
        headers={
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            "user": user_uuid,
        },
    )

    assert returned_value == Order.from_json(cancel_order_response["order"])


@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=404, json={}))
def test_verkkokauppa__cancel_order__returns_none_if_order_is_not_found():
    order_uuid = uuid.UUID(cancel_order_response["order"]["orderId"])
    user_uuid = cancel_order_response["order"]["user"]

    order = VerkkokauppaAPIClient.cancel_order(order_uuid=order_uuid, user_uuid=user_uuid)
    assert order is None


@patch_method(VerkkokauppaAPIClient.generic, return_value=MockResponse(status_code=500, json={}, method="post"))
@patch_method(SentryLogger.log_message)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__cancel_order__raises_exception_on_500_status():
    order_uuid = uuid.UUID(cancel_order_response["order"]["orderId"])
    user_uuid = cancel_order_response["order"]["user"]

    with pytest.raises(CancelOrderError) as ex:
        VerkkokauppaAPIClient.cancel_order(order_uuid=order_uuid, user_uuid=user_uuid)

    err_msg = "Order cancellation failed: POST request to VERKKOKAUPPA (http://example.com) failed with status 500."
    assert str(ex.value) == err_msg
    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_exception.call_count == 1
