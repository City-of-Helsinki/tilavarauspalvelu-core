from uuid import UUID

from assertpy import assert_that
from pytest import raises

from ..product.exceptions import ParseProductError
from ..product.types import CreateProductParams, Product


def test_create_product_params_to_json():
    params = CreateProductParams(
        namespace="some-namespace",
        namespace_entity_id="some-entity-id",
    )
    json = params.to_json()
    expected = {
        "namespace": params.namespace,
        "namespaceEntityId": params.namespace_entity_id,
    }
    assert_that(json).is_equal_to(expected)


def test_product_from_json():
    json = {
        "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
        "namespace": "some-namespace",
        "namespaceEntityId": "some-entity-id",
    }
    product = Product.from_json(json)
    expected = Product(
        product_id=UUID(json["productId"]),
        namespace=json["namespace"],
        namespace_entity_id=json["namespaceEntityId"],
    )
    assert_that(product).is_equal_to(expected)


def test_product_from_json_raises_exception_if_key_is_missing():
    with raises(ParseProductError):
        Product.from_json(
            {
                "namespace": "some-namespace",
                "namespaceEntityId": "some-entity-id",
            }
        )


def test_product_from_json_raises_exception_if_value_is_invalid():
    with raises(ParseProductError):
        Product.from_json(
            {
                "productId": "invalid-product-id",
                "namespace": "some-namespace",
                "namespaceEntityId": "some-entity-id",
            }
        )
