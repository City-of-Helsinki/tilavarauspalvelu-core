from unittest.mock import Mock
from urllib.parse import urljoin
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from pytest import raises
from requests import Timeout

from ..constants import REQUEST_TIMEOUT_SECONDS
from ..order.exceptions import CreateOrderError, GetOrderError
from ..order.requests import create_order, get_order
from ..order.types import Order
from .mocks import mock_get, mock_post


def test_create_order_makes_valid_request(create_order_params, create_order_response):
    post = mock_post(create_order_response)
    create_order(create_order_params, post)
    post.assert_called_with(
        url=settings.VERKKOKAUPPA_ORDER_API_URL,
        json=create_order_params.to_json(),
        headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )


def test_create_order_returns_order_info(create_order_params, create_order_response):
    order_info = create_order(create_order_params, mock_post(create_order_response))
    expected = Order.from_json(create_order_response)
    assert_that(order_info).is_equal_to(expected)


def test_create_order_raises_exception_if_order_id_is_missing(
    create_order_params, create_order_response
):
    create_order_response.pop("orderId")
    with raises(CreateOrderError):
        create_order(create_order_params, mock_post(create_order_response))


def test_create_order_raises_exception_if_checkout_url_is_missing(
    create_order_params, create_order_response
):
    create_order_response.pop("checkoutUrl")
    with raises(CreateOrderError):
        create_order(create_order_params, mock_post(create_order_response))


def test_create_order_raises_exception_if_order_id_is_invalid(
    create_order_params, create_order_response
):
    create_order_response["orderId"] = "invalid-id"
    with raises(CreateOrderError):
        create_order(create_order_params, mock_post(create_order_response))


def test_create_order_raises_exception_on_timeout(create_order_params):
    with raises(CreateOrderError):
        create_order(create_order_params, Mock(side_effect=Timeout()))


def test_create_order_raises_exception_if_status_code_is_not_201(
    create_order_params, create_order_response
):
    post = mock_post(create_order_response, status_code=500)
    with raises(CreateOrderError):
        create_order(create_order_params, post)


def test_get_order_makes_valid_request(get_order_response):
    order_id = UUID(get_order_response["orderId"])
    user = get_order_response["user"]
    get = mock_get(get_order_response)
    get_order(order_id, user, get)
    get.assert_called_with(
        url=urljoin(settings.VERKKOKAUPPA_ORDER_API_URL, f"admin/{order_id}"),
        headers={
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )


def test_get_order_returns_order(get_order_response):
    order_id = UUID(get_order_response["orderId"])
    user = get_order_response["user"]
    order = get_order(order_id, user, mock_get(get_order_response))
    expected = Order.from_json(get_order_response)
    assert_that(order).is_equal_to(expected)


def test_get_order_raises_exception_if_order_id_is_missing(get_order_response):
    order_id = UUID(get_order_response.pop("orderId"))
    user = get_order_response["user"]
    with raises(GetOrderError):
        get_order(order_id, user, mock_get(get_order_response))


def test_get_order_raises_exception_if_checkout_url_is_missing(get_order_response):
    get_order_response.pop("checkoutUrl")
    with raises(GetOrderError):
        get_order(
            UUID(get_order_response["orderId"]),
            get_order_response["user"],
            mock_get(get_order_response),
        )


def test_get_order_raises_exception_on_timeout(get_order_response):
    with raises(GetOrderError):
        get_order(
            UUID(get_order_response["orderId"]),
            get_order_response["user"],
            Mock(side_effect=Timeout()),
        )


def test_get_order_raises_exception_on_404(get_order_response):
    get = mock_get(get_order_response, status_code=404)
    with raises(GetOrderError) as e:
        get_order(
            UUID(get_order_response["orderId"]),
            get_order_response["user"],
            get,
        )
    assert_that(str(e.value)).is_equal_to("Order not found: None")
