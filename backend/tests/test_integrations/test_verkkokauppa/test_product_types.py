from __future__ import annotations

import uuid

import pytest

from tilavarauspalvelu.integrations.verkkokauppa.product.exceptions import ParseAccountingError, ParseProductError
from tilavarauspalvelu.integrations.verkkokauppa.product.types import (
    Accounting,
    CreateOrUpdateAccountingParams,
    CreateProductParams,
    Product,
    ProductInvoicingParams,
)


def test_verkkokauppa__product_types__create_product_params__to_json():
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
    assert json == expected


def test_verkkokauppa__product_types__product__from_json():
    json = {
        "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
        "namespace": "some-namespace",
        "namespaceEntityId": "some-entity-id",
        "merchantId": "533f9326-6df8-4f29-8f00-f476b0bce5a6",
    }
    product = Product.from_json(json)
    expected = Product(
        product_id=uuid.UUID(json["productId"]),
        namespace=json["namespace"],
        namespace_entity_id=json["namespaceEntityId"],
        merchant_id=uuid.UUID(json["merchantId"]),
    )
    assert product == expected


def test_verkkokauppa__product_types__product__from_json__raises_exception_if_key_is_missing():
    with pytest.raises(ParseProductError):
        Product.from_json({
            "namespace": "some-namespace",
            "namespaceEntityId": "some-entity-id",
        })


def test_verkkokauppa__product_types__product__from_json__raises_exception_if_value_is_invalid():
    with pytest.raises(ParseProductError):
        Product.from_json({
            "productId": "invalid-product-id",
            "namespace": "some-namespace",
            "namespaceEntityId": "some-entity-id",
        })


def test_verkkokauppa__product_types__create_or_update_accounting_params__to_json():
    params = CreateOrUpdateAccountingParams(
        vat_code="vat-code",
        internal_order="internal-order",
        profit_center="profit-center",
        project="project",
        operation_area="operation-area",
        company_code="company-code",
        main_ledger_account="main-ledger-account",
        balance_profit_center="2983300",
        product_invoicing=ProductInvoicingParams(
            sales_org="2900",
            sales_office="2911",
            material="12345678",
            order_type="ZTY1",
        ),
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
        "productInvoicing": {
            "salesOrg": "2900",
            "salesOffice": "2911",
            "material": "12345678",
            "orderType": "ZTY1",
        },
    }
    assert json == expected


def test_verkkokauppa__product_types__create_or_update_accounting_params__to_json__drops_empty_fields():
    params = CreateOrUpdateAccountingParams(
        vat_code="vat-code",
        internal_order="",
        profit_center="",
        project="",
        operation_area="",
        company_code="company-code",
        main_ledger_account="main-ledger-account",
        balance_profit_center="2983300",
        product_invoicing=ProductInvoicingParams(
            sales_org="",
            sales_office="",
            material="",
            order_type="",
        ),
    )
    json = params.to_json()
    expected = {
        "vatCode": params.vat_code,
        "companyCode": params.company_code,
        "mainLedgerAccount": params.main_ledger_account,
        "balanceProfitCenter": "2983300",
    }
    assert json == expected


def test_verkkokauppa__product_types__accounting_params__from_json():
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
    assert accounting == expected


def test_verkkokauppa__product_types__accounting_params__from_json__raises_exception_if_key_is_missing():
    with pytest.raises(ParseAccountingError):
        Accounting.from_json({
            "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
            "vatCode": "vat-code",
            "internalOrder": "internal-order",
            "profitCenter": "profit-center",
            "project": "project",
            "operationArea": "operation-area",
            "companyCode": "CODE",
        })
