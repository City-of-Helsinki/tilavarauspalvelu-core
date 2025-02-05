from __future__ import annotations

import uuid
from typing import Any

import pytest
from django.conf import settings

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.merchants.exceptions import CreateMerchantError, UpdateMerchantError
from tilavarauspalvelu.integrations.verkkokauppa.merchants.types import (
    CreateMerchantParams,
    Merchant,
    MerchantInfo,
    UpdateMerchantParams,
)
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient

from tests.helpers import ResponseMock, patch_method

create_merchant_params: CreateMerchantParams = CreateMerchantParams(
    name="Test Merchant",
    paytrail_merchant_id="123456",
    street="Test street 1",
    zip="00112",
    city="Helsinki",
    email="foo.bar@test.mail",
    phone="+358 50 123 4567",
    url="https://test.url",
    tos_url="https://test.url/tos",
    business_id="123456-7",
    shop_id="test-shop-id",
)

update_merchant_params: UpdateMerchantParams = UpdateMerchantParams(
    name="Test Merchant",
    street="Test street 1",
    zip="00112",
    city="Helsinki",
    email="foo.bar@test.mail",
    phone="+358 50 123 4567",
    url="https://test.url",
    tos_url="https://test.url/tos",
    business_id="123456-7",
    shop_id="test-shop-id",
)

mutation_merchant_response: dict[str, Any] = {
    "merchantId": "7107df38-5985-39c9-8c83-ffe18bff24f5",
    "namespace": "tilanvaraus",
    "createdAt": "2022-09-26T10:11:12.000",
    "updatedAt": "2022-09-27T10:11:12.000",
    "configurations": [
        {"key": "merchantName", "value": "Test Merchant", "restricted": False},
        {"key": "merchantStreet", "value": "Test Street 1", "restricted": False},
        {"key": "merchantZip", "value": "00112", "restricted": False},
        {"key": "merchantCity", "value": "Helsinki", "restricted": False},
        {"key": "merchantEmail", "value": "foo.bar@test.mail", "restricted": False},
        {"key": "merchantPhone", "value": "+358 50 123 4567", "restricted": False},
        {"key": "merchantUrl", "value": "https://test.url", "restricted": False},
        {
            "key": "merchantTermsOfServiceUrl",
            "value": "https://test.url/tos",
            "restricted": False,
        },
        {"key": "merchantBusinessId", "value": "123456-7", "restricted": False},
        {
            "key": "merchantOrderWebhookUrl",
            "value": "https://tilavaraus.dev.hel.ninja/v1/webhook/order/",
            "restricted": False,
        },
        {
            "key": "merchantPaymentWebhookUrl",
            "value": "https://tilavaraus.dev.hel.ninja/v1/webhook/payment/",
            "restricted": False,
        },
        {"key": "merchantShopId", "value": "test-shop-id", "restricted": False},
    ],
}

get_merchant_response: dict[str, Any] = {
    "merchantName": "Test Merchant",
    "merchantStreet": "Test Street 1",
    "merchantZip": "00112",
    "merchantCity": "Helsinki",
    "merchantEmail": "foo.bar@test.mail",
    "merchantPhone": "+358 50 123 4567",
    "merchantUrl": "https://test.url",
    "merchantTermsOfServiceUrl": "https://test.url/tos",
    "merchantBusinessId": "123456-7",
    "merchantOrderWebhookUrl": "https://tilavaraus.dev.hel.ninja/v1/webhook/order/",
    "merchantPaymentWebhookUrl": "https://tilavaraus.dev.hel.ninja/v1/webhook/payment/",
    "merchantShopId": "test-shop-id",
}


@patch_method(VerkkokauppaAPIClient.request)
def test__create_merchant__makes_valid_request_returns_merchant():
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=201, json_data=mutation_merchant_response)
    response = VerkkokauppaAPIClient.create_merchant(params=create_merchant_params)

    VerkkokauppaAPIClient.request.assert_called_with(
        method="post",
        url=(settings.VERKKOKAUPPA_MERCHANT_API_URL + "/create/merchant/" + settings.VERKKOKAUPPA_NAMESPACE),
        json=create_merchant_params.to_json(),
        headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
    )

    assert response == Merchant.from_json(mutation_merchant_response)


@patch_method(VerkkokauppaAPIClient.request)
def test__create_merchant__raises_exception_if_merchant_id_is_missing():
    response = mutation_merchant_response.copy()
    response.pop("merchantId")
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=201, json_data=response)

    with pytest.raises(CreateMerchantError):
        VerkkokauppaAPIClient.create_merchant(params=create_merchant_params)


@patch_method(VerkkokauppaAPIClient.request)
def test__create_merchant__raises_exception_if_merchant_id_is_invalid():
    response = mutation_merchant_response.copy()
    response["merchantId"] = "invalid-id"
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=201, json_data=response)

    with pytest.raises(CreateMerchantError):
        VerkkokauppaAPIClient.create_merchant(params=create_merchant_params)


@patch_method(VerkkokauppaAPIClient.request)
@patch_method(SentryLogger.log_message)
def test__create_merchant__raises_exception_if_status_code_is_not_201():
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=500, json_data=mutation_merchant_response)

    with pytest.raises(CreateMerchantError):
        VerkkokauppaAPIClient.create_merchant(params=create_merchant_params)

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.request)
def test__update_merchant__makes_valid_request_returns_merchant():
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=200, json_data=mutation_merchant_response)

    response = VerkkokauppaAPIClient.update_merchant(
        merchant_uuid=uuid.UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
        params=update_merchant_params,
    )

    VerkkokauppaAPIClient.request.assert_called_with(
        method="post",
        url=(
            settings.VERKKOKAUPPA_MERCHANT_API_URL
            + "/update/merchant/"
            + settings.VERKKOKAUPPA_NAMESPACE
            + "/7107df38-5985-39c9-8c83-ffe18bff24f5"
        ),
        json=update_merchant_params.to_json(),
        headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
    )

    assert response == Merchant.from_json(mutation_merchant_response)


@patch_method(VerkkokauppaAPIClient.request)
def test__update_merchant__raises_exception_if_merchant_id_is_missing():
    response = mutation_merchant_response.copy()
    response.pop("merchantId")
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=200, json_data=response)

    with pytest.raises(UpdateMerchantError):
        VerkkokauppaAPIClient.update_merchant(
            merchant_uuid=uuid.UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"), params=create_merchant_params
        )


@patch_method(VerkkokauppaAPIClient.request)
def test__update_merchant__raises_exception_if_merchant_id_is_invalid():
    response = mutation_merchant_response.copy()
    response["merchantId"] = "invalid-id"
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=200, json_data=response)

    with pytest.raises(UpdateMerchantError):
        VerkkokauppaAPIClient.update_merchant(
            merchant_uuid=uuid.UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"), params=create_merchant_params
        )


@patch_method(VerkkokauppaAPIClient.request)
@patch_method(SentryLogger.log_message)
def test__update_merchant__raises_exception_if_status_code_is_not_200():
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=500, json_data=mutation_merchant_response)

    with pytest.raises(UpdateMerchantError):
        VerkkokauppaAPIClient.update_merchant(
            merchant_uuid=uuid.UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"), params=create_merchant_params
        )

    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.request)
def test__update_merchant__raises_exception_if_status_code_is_404():
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=404, json_data={})

    with pytest.raises(UpdateMerchantError):
        VerkkokauppaAPIClient.update_merchant(
            merchant_uuid=uuid.UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"), params=create_merchant_params
        )


@patch_method(VerkkokauppaAPIClient.request)
def test__get_merchant__returns_merchant():
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=200, json_data=get_merchant_response)

    response = VerkkokauppaAPIClient.get_merchant(merchant_uuid=uuid.UUID("0312c2f7-3ed6-409e-84e3-ae21196e685d"))
    assert response == MerchantInfo.from_json(get_merchant_response)


@patch_method(VerkkokauppaAPIClient.request)
def test__get_merchant__returns_none():
    error_response = {
        "errors": [
            {
                "code": "failed-to-fetch-merchant-configurations",
                "message": "Failed to fetch - Merchant not found.",
            }
        ]
    }
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=404, json_data=error_response)

    merchant = VerkkokauppaAPIClient.get_merchant(merchant_uuid=uuid.UUID("0312c2f7-3ed6-409e-84e3-ae21196e685d"))
    assert merchant is None
