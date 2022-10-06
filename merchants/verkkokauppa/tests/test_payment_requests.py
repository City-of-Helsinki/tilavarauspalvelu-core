from unittest.mock import Mock
from urllib.parse import urljoin
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from pytest import raises
from requests import Timeout

from ..constants import REQUEST_TIMEOUT_SECONDS
from ..payment.exceptions import GetPaymentError
from ..payment.requests import get_payment
from ..payment.types import Payment
from .mocks import mock_get


def test_get_payment_makes_valid_request(get_payment_response):
    order_id = UUID(get_payment_response["orderId"])
    namespace = get_payment_response["namespace"]
    get = mock_get(get_payment_response)
    get_payment(order_id, namespace, get)
    get.assert_called_with(
        url=urljoin(settings.VERKKOKAUPPA_PAYMENT_API_URL, f"admin/{order_id}"),
        headers={
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            "namespace": get_payment_response["namespace"],
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )


def test_get_payment_returns_payment(get_payment_response):
    order_id = UUID(get_payment_response["orderId"])
    namespace = get_payment_response["namespace"]
    payment = get_payment(order_id, namespace, mock_get(get_payment_response))
    expected = Payment.from_json(get_payment_response)
    assert_that(payment).is_equal_to(expected)


def test_get_payment_raises_exception_if_key_is_missing(get_payment_response):
    order_id = UUID(get_payment_response.pop("orderId"))
    namespace = get_payment_response["namespace"]
    with raises(GetPaymentError):
        get_payment(order_id, namespace, mock_get(get_payment_response))


def test_get_payment_raises_exception_if_value_is_invalid(get_payment_response):
    order_id = UUID(get_payment_response["orderId"])
    get_payment_response["orderId"] = "invalid-id"
    namespace = get_payment_response["namespace"]
    with raises(GetPaymentError):
        get_payment(order_id, namespace, mock_get(get_payment_response))


def test_get_payment_raises_exception_on_timeout(get_payment_response):
    order_id = UUID(get_payment_response["orderId"])
    get_payment_response["orderId"] = "invalid-id"
    namespace = get_payment_response["namespace"]
    with raises(GetPaymentError):
        get_payment(order_id, namespace, Mock(side_effect=Timeout()))
