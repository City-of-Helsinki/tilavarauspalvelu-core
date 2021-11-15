from contextlib import suppress
from unittest.mock import Mock

from assertpy import assert_that
from django.conf import settings
from pytest import raises
from requests import Timeout

from ..constants import REQUEST_TIMEOUT_SECONDS
from ..product.exceptions import CreateProductError
from ..product.requests import create_product
from ..product.types import Product
from ..tests.mocks import mock_post


def test_create_product_makes_valid_request(create_product_params):
    post = mock_post({})
    with suppress(Exception):
        create_product(create_product_params, post)
    post.assert_called_with(
        url=settings.VERKKOKAUPPA_PRODUCT_API_URL,
        json=create_product_params.to_json(),
        headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
        timeout=REQUEST_TIMEOUT_SECONDS,
    )


def test_create_product_returns_product(create_product_params, create_product_response):
    product = create_product(create_product_params, mock_post(create_product_response))
    expected = Product.from_json(create_product_response)
    assert_that(product).is_equal_to(expected)


def test_create_product_raises_exception_if_product_id_is_missing(
    create_product_params, create_product_response
):
    create_product_response.pop("productId")
    with raises(CreateProductError):
        create_product(create_product_params, mock_post(create_product_response))


def test_create_product_raises_exception_if_product_id_is_invalid(
    create_product_params, create_product_response
):
    create_product_response["productId"] = "invalid-id"
    with raises(CreateProductError):
        create_product(create_product_params, mock_post(create_product_response))


def test_create_product_raises_exception_if_status_code_is_not_201(
    create_product_params, create_product_response
):
    post = mock_post(create_product_response, status_code=500)
    with raises(CreateProductError):
        create_product(create_product_params, post)


def test_create_product_raises_exception_on_timeout(create_product_params):
    with raises(CreateProductError):
        create_product(create_product_params, Mock(side_effect=Timeout()))
