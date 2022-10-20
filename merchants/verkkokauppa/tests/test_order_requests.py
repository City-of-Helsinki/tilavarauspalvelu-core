from decimal import Decimal
from typing import Any, Dict
from unittest.mock import Mock
from urllib.parse import urljoin
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from pytest import raises
from requests import Timeout

from ..constants import REQUEST_TIMEOUT_SECONDS
from ..order.exceptions import CreateOrderError, GetOrderError
from ..order.requests import create_order, get_order
from ..order.types import (
    CreateOrderParams,
    Order,
    OrderCustomer,
    OrderItemMetaParams,
    OrderItemParams,
)
from .mocks import mock_get, mock_post


class OrderRequestsTestCaseBase(TestCase):
    create_order_params: CreateOrderParams = CreateOrderParams(
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

    create_order_response: Dict[str, Any] = {
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

    get_order_response: Dict[str, Any] = {
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

    get_order_404_response: Dict[str, Any] = {
        "errors": [{"code": "order-not-found", "message": "Order not found"}]
    }


class CreateOrderRequestsTestCase(OrderRequestsTestCaseBase):
    def test_create_order_makes_valid_request(self):
        post = mock_post(self.create_order_response)
        create_order(self.create_order_params, post)
        post.assert_called_with(
            url=settings.VERKKOKAUPPA_ORDER_API_URL,
            json=self.create_order_params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_create_order_returns_order_info(self):
        order_info = create_order(
            self.create_order_params, mock_post(self.create_order_response)
        )
        expected = Order.from_json(self.create_order_response)
        assert_that(order_info).is_equal_to(expected)

    def test_create_order_raises_exception_if_order_id_is_missing(self):
        response = self.create_order_response.copy()
        response.pop("orderId")
        with raises(CreateOrderError):
            create_order(self.create_order_params, mock_post(response))

    def test_create_order_raises_exception_if_checkout_url_is_missing(self):
        response = self.create_order_response.copy()
        response.pop("checkoutUrl")
        with raises(CreateOrderError):
            create_order(self.create_order_params, mock_post(response))

    def test_create_order_raises_exception_if_order_id_is_invalid(self):
        response = self.create_order_response.copy()
        response["orderId"] = "invalid-id"
        with raises(CreateOrderError):
            create_order(self.create_order_params, mock_post(response))

    def test_create_order_raises_exception_on_timeout(self):
        with raises(CreateOrderError):
            create_order(self.create_order_params, Mock(side_effect=Timeout()))

    def test_create_order_raises_exception_if_status_code_is_not_201(self):
        post = mock_post(self.create_order_response, status_code=500)
        with raises(CreateOrderError):
            create_order(self.create_order_params, post)


class GetOrderRequestsTestCase(OrderRequestsTestCaseBase):
    def test_get_order_makes_valid_request(self):
        order_id = UUID(self.get_order_response["orderId"])
        user = self.get_order_response["user"]
        get = mock_get(self.get_order_response)
        get_order(order_id, user, get)
        get.assert_called_with(
            url=urljoin(settings.VERKKOKAUPPA_ORDER_API_URL, f"admin/{order_id}"),
            headers={
                "api-key": settings.VERKKOKAUPPA_API_KEY,
                "namespace": settings.VERKKOKAUPPA_NAMESPACE,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_get_order_returns_order(self):
        order_id = UUID(self.get_order_response["orderId"])
        user = self.get_order_response["user"]
        order = get_order(order_id, user, mock_get(self.get_order_response))
        expected = Order.from_json(self.get_order_response)
        assert_that(order).is_equal_to(expected)

    def test_get_order_raises_exception_if_order_id_is_missing(self):
        response = self.get_order_response.copy()
        order_id = UUID(response.pop("orderId"))
        user = self.get_order_response["user"]
        with raises(GetOrderError):
            get_order(order_id, user, mock_get(response))

    def test_get_order_raises_exception_if_checkout_url_is_missing(self):
        response = self.get_order_response.copy()
        response.pop("checkoutUrl")
        with raises(GetOrderError):
            get_order(
                UUID(response["orderId"]),
                response["user"],
                mock_get(response),
            )

    def test_get_order_raises_exception_on_timeout(self):
        with raises(GetOrderError):
            get_order(
                UUID(self.get_order_response["orderId"]),
                self.get_order_response["user"],
                Mock(side_effect=Timeout()),
            )

    def test_get_order_raises_exception_on_404(self):
        get = mock_get(self.get_order_404_response, status_code=404)
        with raises(GetOrderError) as e:
            get_order(
                UUID(self.get_order_response["orderId"]),
                self.get_order_response["user"],
                get,
            )
        assert_that(str(e.value)).is_equal_to(
            "Order not found: [{'code': 'order-not-found', 'message': 'Order not found'}]"
        )
