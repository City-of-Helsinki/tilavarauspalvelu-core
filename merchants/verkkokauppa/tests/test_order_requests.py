from datetime import datetime
from decimal import Decimal
from typing import Any, Dict
from unittest import mock
from unittest.mock import Mock
from urllib.parse import urljoin
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from django.utils.timezone import utc
from pytest import raises
from requests import Timeout

from ..constants import REQUEST_TIMEOUT_SECONDS
from ..order.exceptions import CancelOrderError, CreateOrderError, GetOrderError
from ..order.requests import cancel_order, create_order, get_order
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
        language="fi",
        price_net=Decimal("100.0"),
        price_vat=Decimal("24.0"),
        price_total=Decimal("124.0"),
        last_valid_purchase_datetime=datetime(2022, 11, 24, 12, 0, 0, tzinfo=utc),
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
        "receiptUrl": "http://localhost:12344/c1c55d55-4ef6-4a4c-8195-4f5022ad8ed8",
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
        "receiptUrl": "http://localhost:12344/c1c55d55-4ef6-4a4c-8195-4f5022ad8ed8",
        "priceNet": "100",
        "priceVat": "24",
        "priceTotal": "124",
        "isValidForCheckout": True,
        "merchant": {},
    }

    get_order_404_response: Dict[str, Any] = {"errors": [{"code": "order-not-found", "message": "Order not found"}]}

    cancel_order_response: Dict[str, Any] = {
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


class CreateOrderRequestsTestCase(OrderRequestsTestCaseBase):
    def test_create_order_makes_valid_request(self):
        post = mock_post(self.create_order_response)
        create_order(self.create_order_params, post)
        post.assert_called_with(
            url=settings.VERKKOKAUPPA_ORDER_API_URL + "/",
            json=self.create_order_params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_create_order_returns_order_info(self):
        order_info = create_order(self.create_order_params, mock_post(self.create_order_response))
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

    def test_create_order_raises_exception_if_status_is_500(self):
        post = mock_post(self.create_order_response, status_code=500)
        with raises(CreateOrderError) as ex:
            create_order(self.create_order_params, post)

        assert_that(str(ex.value)).is_equal_to("Order creation failed: problem with upstream service")

    def test_create_order_raises_exception_if_status_code_is_not_201(self):
        post = mock_post(self.create_order_response, status_code=400)
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


class CancelOrderRequestsTestCase(OrderRequestsTestCaseBase):
    def test_cancel_order_makes_valid_request(self):
        order_id = UUID(self.cancel_order_response["order"]["orderId"])
        user = self.cancel_order_response["order"]["user"]
        post = mock_post(self.cancel_order_response, status_code=200)
        cancel_order(order_id, user, post)
        post.assert_called_with(
            url=urljoin(settings.VERKKOKAUPPA_ORDER_API_URL, f"{order_id}/cancel"),
            headers={
                "api-key": settings.VERKKOKAUPPA_API_KEY,
                "user": user,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_cancel_order_returns_order(self):
        order_id = UUID(self.cancel_order_response["order"]["orderId"])
        user = self.cancel_order_response["order"]["user"]
        post = mock_post(self.cancel_order_response, status_code=200)
        order = cancel_order(order_id, user, post)
        expected = Order.from_json(self.cancel_order_response["order"])
        assert_that(order).is_equal_to(expected)

    def test_cancel_order_returns_none_if_order_is_not_found(self):
        order_id = UUID(self.cancel_order_response["order"]["orderId"])
        user = self.cancel_order_response["order"]["user"]
        post = mock_post({}, status_code=404)
        order = cancel_order(order_id, user, post)
        assert_that(order).is_none()

    @mock.patch("merchants.verkkokauppa.order.requests.capture_message")
    def test_cancel_order_raises_exception_on_500_status(self, mock_capture):
        order_id = UUID(self.cancel_order_response["order"]["orderId"])
        user = self.cancel_order_response["order"]["user"]
        post = mock_post({}, status_code=500)

        with raises(CancelOrderError) as ex:
            cancel_order(order_id, user, post)

        assert_that(str(ex.value)).is_equal_to("Order cancellation failed: problem with upstream service")
        assert_that(mock_capture.called).is_true()
