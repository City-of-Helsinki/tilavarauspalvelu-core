from contextlib import suppress
from typing import Dict
from unittest.mock import Mock
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from pytest import raises
from requests import Timeout

from ..constants import REQUEST_TIMEOUT_SECONDS
from ..product.exceptions import (
    CreateOrUpdateAccountingError,
    CreateProductError,
    GetProductMappingError,
)
from ..product.requests import (
    create_or_update_accounting,
    create_product,
    get_product_mapping,
)
from ..product.types import CreateOrUpdateAccountingParams, CreateProductParams, Product
from ..tests.mocks import mock_get, mock_post


class ProductRequestsTestCaseBase(TestCase):
    @classmethod
    def create_product_params(cls) -> CreateProductParams:
        return CreateProductParams(
            namespace="test-namespace",
            namespace_entity_id="test-namespace-entity-id",
            merchant_id="be4154c7-9f66-4625-998b-18abac4ecae7",
        )

    @classmethod
    def create_or_update_account_params(cls) -> CreateOrUpdateAccountingParams:
        return CreateOrUpdateAccountingParams(
            vat_code="AB",
            internal_order="1234567890",
            profit_center="1111111",
            project="2222222",
            operation_area="333333",
            company_code="4444",
            main_ledger_account="555555",
            balance_profit_center="2983300",
        )

    @classmethod
    def create_product_response(cls) -> Dict[str, str]:
        return {
            "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
            "namespace": "test-namespace",
            "namespaceEntityId": "test-namespace-entity-id",
            "merchantId": "be4154c7-9f66-4625-998b-18abac4ecae7",
        }

    @classmethod
    def get_product_mapping_response(cls) -> Dict[str, str]:
        return {
            "productId": "0bd382a0-d79f-44c8-b3c6-8617bf72ebd5",
            "namespace": "test-namespace",
            "namespaceEntityId": "test-namespace-entity-id",
            "merchantId": "5fdb7904-1a82-4a3b-9480-cd02cce37999",
        }

    @classmethod
    def create_or_update_accounting_response(cls) -> Dict[str, str]:
        return {
            "productId": "0bd382a0-d79f-44c8-b3c6-8617bf72ebd5",
            "vatCode": "AB",
            "internalOrder": "1234567890",
            "profitCenter": "1111111",
            "project": "2222222",
            "operationArea": "333333",
            "companyCode": "4444",
            "mainLedgerAccount": "555555",
        }


class CreateProductTestCase(ProductRequestsTestCaseBase):
    def test_create_product_makes_valid_request(self):
        params = self.create_product_params()
        post = mock_post(params.to_json())
        with suppress(Exception):
            create_product(params, post)
        post.assert_called_with(
            url=settings.VERKKOKAUPPA_PRODUCT_API_URL + "/",
            json=params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_create_product_returns_product(self):
        params = self.create_product_params()
        response = self.create_product_response()
        product = create_product(params, mock_post(response))
        expected = Product.from_json(response)
        assert_that(product).is_equal_to(expected)

    def test_create_product_raises_exception_if_product_id_is_missing(self):
        response = self.create_product_response()
        params = self.create_product_params()
        response.pop("productId")
        with raises(CreateProductError):
            create_product(params, mock_post(response))

    def test_create_product_raises_exception_if_product_id_is_invalid(self):
        response = self.create_product_response()
        params = self.create_product_params()
        response["productId"] = "invalid-id"
        with raises(CreateProductError):
            create_product(params, mock_post(response))

    def test_create_product_raises_exception_if_status_code_is_not_201(self):
        response = {"errors": [{"code": "mock-error", "message": "Error Message"}]}
        params = self.create_product_params()
        post = mock_post(response, status_code=500)
        with raises(CreateProductError) as e:
            create_product(params, post)

        assert_that(str(e.value)).contains("mock-error")

    def test_create_product_raises_exception_on_timeout(self):
        params = self.create_product_params()
        with raises(CreateProductError):
            create_product(params, Mock(side_effect=Timeout()))


class GetProductMappingTestCase(ProductRequestsTestCaseBase):
    product_id = UUID("0bd382a0-d79f-44c8-b3c6-8617bf72ebd5")

    def test_get_product_mapping_makes_valid_request(self):
        get = mock_get(self.get_product_mapping_response())
        get_product_mapping(self.product_id, get)
        get.assert_called_with(
            url=(settings.VERKKOKAUPPA_PRODUCT_API_URL + "/0bd382a0-d79f-44c8-b3c6-8617bf72ebd5/mapping"),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_get_product_mapping_returns_mapping(self):
        response = self.get_product_mapping_response()
        get = mock_get(response)
        mapping = get_product_mapping(self.product_id, get)
        expected = Product.from_json(response)
        assert_that(mapping).is_equal_to(expected)

    def test_get_product_mapping_returns_none_404(self):
        response = {
            "errors": [
                {
                    "code": "product-mapping-not-found",
                    "message": "Product mapping not found",
                }
            ]
        }
        get = mock_get(response, status_code=404)
        mapping = get_product_mapping(self.product_id, get)
        assert_that(mapping).is_none()

    def test_get_product_mapping_raises_exception_on_server_error(self):
        response = {"errors": [{"code": "mock-error", "message": "Error Message"}]}
        get = mock_get(response, status_code=500)
        with raises(GetProductMappingError) as e:
            get_product_mapping(self.product_id, get)

        assert_that(str(e.value)).contains("mock-error")

    def test_get_product_mapping_raises_exception_if_field_is_missing(self):
        response = self.get_product_mapping_response()
        response.pop("merchantId")
        get = mock_get(response)
        with raises(GetProductMappingError):
            get_product_mapping(self.product_id, get)


class CreateOrUpdateAccountingTestCase(ProductRequestsTestCaseBase):
    def test_create_or_update_account_makes_valid_request(self):
        params = self.create_or_update_account_params()
        post = mock_post(params.to_json())
        with suppress(Exception):
            create_or_update_accounting("0bd382a0-d79f-44c8-b3c6-8617bf72ebd5", params, post)
        post.assert_called_with(
            url=settings.VERKKOKAUPPA_PRODUCT_API_URL + "/0bd382a0-d79f-44c8-b3c6-8617bf72ebd5/accounting",
            json=params.to_json(),
            headers={
                "api-key": settings.VERKKOKAUPPA_API_KEY,
                "namespace": settings.VERKKOKAUPPA_NAMESPACE,
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_create_or_update_accounting_raises_exception_if_status_code_is_not_201(
        self,
    ):
        response = {"errors": [{"code": "mock-error", "message": "Error Message"}]}
        params = self.create_or_update_account_params()
        post = mock_post(response, status_code=500)
        with raises(CreateOrUpdateAccountingError) as e:
            create_or_update_accounting("0bd382a0-d79f-44c8-b3c6-8617bf72ebd5", params, post)

        assert_that(str(e.value)).contains("mock-error")

    def test_create_or_update_accounting_raises_exception_on_timeout(self):
        params = self.create_or_update_account_params()
        with raises(CreateOrUpdateAccountingError):
            create_or_update_accounting(
                "0bd382a0-d79f-44c8-b3c6-8617bf72ebd5",
                params,
                Mock(side_effect=Timeout()),
            )
