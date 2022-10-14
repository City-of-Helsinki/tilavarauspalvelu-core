from uuid import UUID

from assertpy import assert_that
from django.test.testcases import TestCase
from pytest import raises

from ..product.exceptions import ParseProductError
from ..product.types import CreateProductParams, Product


class ProductTypesTestCase(TestCase):
    def test_create_product_params_to_json(self):
        params = CreateProductParams(
            namespace="some-namespace",
            namespace_entity_id="some-entity-id",
            merchant_id="some-merchant-id",
        )
        json = params.to_json()
        expected = {
            "namespace": params.namespace,
            "namespaceEntityId": params.namespace_entity_id,
            "merchantId": str(params.merchant_id),
        }
        assert_that(json).is_equal_to(expected)

    def test_product_from_json(self):
        json = {
            "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
            "namespace": "some-namespace",
            "namespaceEntityId": "some-entity-id",
            "merchantId": "533f9326-6df8-4f29-8f00-f476b0bce5a6",
        }
        product = Product.from_json(json)
        expected = Product(
            product_id=UUID(json["productId"]),
            namespace=json["namespace"],
            namespace_entity_id=json["namespaceEntityId"],
            merchant_id=UUID(json["merchantId"]),
        )
        assert_that(product).is_equal_to(expected)

    def test_product_from_json_raises_exception_if_key_is_missing(self):
        with raises(ParseProductError):
            Product.from_json(
                {
                    "namespace": "some-namespace",
                    "namespaceEntityId": "some-entity-id",
                }
            )

    def test_product_from_json_raises_exception_if_value_is_invalid(self):
        with raises(ParseProductError):
            Product.from_json(
                {
                    "productId": "invalid-product-id",
                    "namespace": "some-namespace",
                    "namespaceEntityId": "some-entity-id",
                }
            )
