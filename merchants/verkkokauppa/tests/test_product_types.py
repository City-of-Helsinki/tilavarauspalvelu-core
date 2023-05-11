from uuid import UUID

from assertpy import assert_that
from django.test.testcases import TestCase
from pytest import raises

from ..product.exceptions import ParseAccountingError, ParseProductError
from ..product.types import (
    Accounting,
    CreateOrUpdateAccountingParams,
    CreateProductParams,
    Product,
)


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

    def test_create_or_update_accounting_params_to_json(self):
        params = CreateOrUpdateAccountingParams(
            vat_code="vat-code",
            internal_order="internal-order",
            profit_center="profit-center",
            project="project",
            operation_area="operation-area",
            company_code="company-code",
            main_ledger_account="main-ledger-account",
            balance_profit_center="2983300",
        )
        json = params.to_json()
        expected = {
            "vatCode": params.vat_code,
            "internalOrder": params.internal_order,
            "profitCenter": params.profit_center,
            "project": params.project,
            "operationArea": params.operation_area,
            "companyCode": params.company_code,
            "mainLedgerAccount": params.main_ledger_account,
            "balanceProfitCenter": "2983300",
        }
        assert_that(json).is_equal_to(expected)

    def test_create_or_update_accounting_params_to_json_drops_null_fields(self):
        params = CreateOrUpdateAccountingParams(
            vat_code="vat-code",
            internal_order=None,
            profit_center=None,
            project=None,
            operation_area="operation-area",
            company_code="company-code",
            main_ledger_account="main-ledger-account",
            balance_profit_center="2983300",
        )
        json = params.to_json()
        expected = {
            "vatCode": params.vat_code,
            "operationArea": params.operation_area,
            "companyCode": params.company_code,
            "mainLedgerAccount": params.main_ledger_account,
            "balanceProfitCenter": "2983300",
        }
        assert_that(json).is_equal_to(expected)

    def test_accounting_from_json(self):
        json = {
            "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
            "vatCode": "vat-code",
            "internalOrder": "internal-order",
            "profitCenter": "profit-center",
            "project": "project",
            "operationArea": "operation-area",
            "companyCode": "CODE",
            "mainLedgerAccount": "main-ledger-account",
            "balanceProfitCenter": "2983300",
        }
        accounting = Accounting.from_json(json)
        expected = Accounting(
            product_id=json["productId"],
            vat_code=json["vatCode"],
            internal_order=json["internalOrder"],
            profit_center=json["profitCenter"],
            project=json["project"],
            operation_area=json["operationArea"],
            company_code=json["companyCode"],
            main_ledger_account=json["mainLedgerAccount"],
            balance_profit_center=json["balanceProfitCenter"],
        )
        assert_that(accounting).is_equal_to(expected)

    def test_accounting_from_json_raises_exception_if_key_is_missing(self):
        with raises(ParseAccountingError):
            Accounting.from_json(
                {
                    "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
                    "vatCode": "vat-code",
                    "internalOrder": "internal-order",
                    "profitCenter": "profit-center",
                    "project": "project",
                    "operationArea": "operation-area",
                    "companyCode": "CODE",
                }
            )
