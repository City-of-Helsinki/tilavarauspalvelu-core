from __future__ import annotations

import uuid

import pytest
from django.conf import settings
from requests import Timeout

from tilavarauspalvelu.utils.verkkokauppa.product.exceptions import CreateOrUpdateAccountingError, CreateProductError
from tilavarauspalvelu.utils.verkkokauppa.product.types import (
    Accounting,
    CreateOrUpdateAccountingParams,
    CreateProductParams,
    Product,
)
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from utils.sentry import SentryLogger

from tests.helpers import patch_method
from tests.mocks import MockResponse

create_product_params = CreateProductParams(
    namespace="test-namespace",
    namespace_entity_id="test-namespace-entity-id",
    merchant_id="be4154c7-9f66-4625-998b-18abac4ecae7",
)


create_or_update_account_params = CreateOrUpdateAccountingParams(
    vat_code="AB",
    internal_order="1234567890",
    profit_center="1111111",
    project="2222222",
    operation_area="333333",
    company_code="4444",
    main_ledger_account="555555",
    balance_profit_center="2983300",
)


create_product_response = {
    "productId": "306ab20a-6b30-3ce3-95e8-fef818e6c30e",
    "namespace": "test-namespace",
    "namespaceEntityId": "test-namespace-entity-id",
    "merchantId": "be4154c7-9f66-4625-998b-18abac4ecae7",
}


create_or_update_accounting_response = {
    "productId": "0bd382a0-d79f-44c8-b3c6-8617bf72ebd5",
    "vatCode": "AB",
    "internalOrder": "1234567890",
    "profitCenter": "1111111",
    "project": "2222222",
    "operationArea": "333333",
    "companyCode": "4444",
    "mainLedgerAccount": "555555",
    "balanceProfitCenter": "666666",
}


@patch_method(VerkkokauppaAPIClient.generic)
def test__create_product__makes_valid_request():
    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=201, json=create_product_response)

    response = VerkkokauppaAPIClient.create_product(params=create_product_params)

    VerkkokauppaAPIClient.generic.assert_called_with(
        "post",
        url=settings.VERKKOKAUPPA_PRODUCT_API_URL + "/",
        json=create_product_params.to_json(),
        headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
    )

    assert response == Product.from_json(create_product_response)


@patch_method(VerkkokauppaAPIClient.generic)
def test__create_product__raises_exception_if_product_id_is_missing():
    response = create_product_response.copy()
    response.pop("productId")
    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=201, json=response)

    with pytest.raises(CreateProductError):
        VerkkokauppaAPIClient.create_product(params=create_product_params)


@patch_method(VerkkokauppaAPIClient.generic)
def test__create_product__raises_exception_if_product_id_is_invalid():
    response = create_product_response.copy()
    response["productId"] = "invalid-id"
    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=201, json=response)

    with pytest.raises(CreateProductError):
        VerkkokauppaAPIClient.create_product(params=create_product_params)


@patch_method(VerkkokauppaAPIClient.generic)
@patch_method(SentryLogger.log_message)
def test__create_product__raises_exception_if_status_code_is_not_201():
    response = {"errors": [{"code": "mock-error", "message": "Error Message"}]}
    VerkkokauppaAPIClient.generic.return_value = MockResponse(status_code=500, json=response)

    with pytest.raises(CreateProductError):
        VerkkokauppaAPIClient.create_product(params=create_product_params)

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.generic, side_effect=Timeout())
def test__create_product__raises_exception_on_timeout():
    with pytest.raises(CreateProductError):
        VerkkokauppaAPIClient.create_product(params=create_product_params)


@patch_method(VerkkokauppaAPIClient.generic)
def test__create_or_update__account_makes_valid_request():
    VerkkokauppaAPIClient.generic.return_value = MockResponse(
        status_code=201, json=create_or_update_accounting_response
    )

    response = VerkkokauppaAPIClient.create_or_update_accounting(
        product_uuid=uuid.UUID("0bd382a0-d79f-44c8-b3c6-8617bf72ebd5"),
        params=create_or_update_account_params,
    )

    VerkkokauppaAPIClient.generic.assert_called_with(
        "post",
        url=settings.VERKKOKAUPPA_PRODUCT_API_URL + "/0bd382a0-d79f-44c8-b3c6-8617bf72ebd5/accounting",
        json=create_or_update_account_params.to_json(),
        headers={
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        },
    )

    assert response == Accounting.from_json(create_or_update_accounting_response)


@patch_method(VerkkokauppaAPIClient.generic)
@patch_method(SentryLogger.log_message)
def test__create_or_update_accounting__raises_exception_if_status_code_is_not_201():
    VerkkokauppaAPIClient.generic.return_value = MockResponse(
        status_code=500, json={"errors": [{"code": "mock-error", "message": "Error Message"}]}
    )

    with pytest.raises(CreateOrUpdateAccountingError):
        VerkkokauppaAPIClient.create_or_update_accounting(
            product_uuid=uuid.UUID("0bd382a0-d79f-44c8-b3c6-8617bf72ebd5"),
            params=create_or_update_account_params,
        )

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.generic, side_effect=Timeout())
def test__create_or_update_accounting__raises_exception_on_timeout():
    with pytest.raises(CreateOrUpdateAccountingError):
        VerkkokauppaAPIClient.create_or_update_accounting(
            product_uuid=uuid.UUID("0bd382a0-d79f-44c8-b3c6-8617bf72ebd5"),
            params=create_or_update_account_params,
        )
