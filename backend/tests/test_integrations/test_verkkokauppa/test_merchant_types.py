from __future__ import annotations

import datetime
import uuid
from typing import Any

import pytest
from django.conf import settings

from tilavarauspalvelu.integrations.verkkokauppa.merchants.exceptions import ParseMerchantError
from tilavarauspalvelu.integrations.verkkokauppa.merchants.types import (
    CreateMerchantParams,
    Merchant,
    MerchantInfo,
    UpdateMerchantParams,
)

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]

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


def test_verkkokauppa__merchant_types__merchant_info__from_json():
    expected = MerchantInfo(
        name="Test Merchant",
        street="Test Street 1",
        zip="00112",
        city="Helsinki",
        email="foo.bar@test.mail",
        phone="+358 50 123 4567",
        url="https://test.url",
        tos_url="https://test.url/tos",
        business_id="123456-7",
        shop_id="test-shop-id",
    )
    actual = MerchantInfo.from_json(get_merchant_response)
    assert actual == expected


def test_verkkokauppa__merchant_types__merchant__from_json():
    expected = Merchant(
        id=uuid.UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
        namespace="tilanvaraus",
        created_at=datetime.datetime(2022, 9, 26, 10, 11, 12, tzinfo=settings.VERKKOKAUPPA_TIMEZONE),
        updated_at=datetime.datetime(2022, 9, 27, 10, 11, 12, tzinfo=settings.VERKKOKAUPPA_TIMEZONE),
        name="Test Merchant",
        street="Test Street 1",
        zip="00112",
        city="Helsinki",
        email="foo.bar@test.mail",
        phone="+358 50 123 4567",
        url="https://test.url",
        tos_url="https://test.url/tos",
        business_id="123456-7",
        shop_id="test-shop-id",
    )
    actual = Merchant.from_json(mutation_merchant_response)
    assert expected == actual


def test_verkkokauppa__merchant_types__merchant__from_json__empty_configurations():
    expected = Merchant(
        id=uuid.UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
        namespace="tilanvaraus",
        created_at=datetime.datetime(2022, 9, 26, 10, 11, 12, tzinfo=settings.VERKKOKAUPPA_TIMEZONE),
        updated_at=datetime.datetime(2022, 9, 27, 10, 11, 12, tzinfo=settings.VERKKOKAUPPA_TIMEZONE),
        name="",
        street="",
        zip="",
        city="",
        email="",
        phone="",
        url="",
        tos_url="",
        business_id="",
        shop_id="",
    )
    response = mutation_merchant_response.copy()
    response["configurations"] = []

    actual = Merchant.from_json(response)
    assert expected == actual


def test_verkkokauppa__merchant_types__merchant__from_json__missing_field():
    response = mutation_merchant_response.copy()
    response.pop("merchantId")
    with pytest.raises(ParseMerchantError):
        Merchant.from_json(response)


def test_verkkokauppa__merchant_types__create_merchant_params__to_json():
    params = CreateMerchantParams(
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

    expected = {
        "merchantName": "Test Merchant",
        "merchantPaytrailMerchantId": "123456",
        "merchantStreet": "Test street 1",
        "merchantZip": "00112",
        "merchantCity": "Helsinki",
        "merchantEmail": "foo.bar@test.mail",
        "merchantPhone": "+358 50 123 4567",
        "merchantUrl": "https://test.url",
        "merchantTermsOfServiceUrl": "https://test.url/tos",
        "merchantBusinessId": "123456-7",
        "merchantShopId": "test-shop-id",
    }

    assert params.to_json() == expected


def test_verkkokauppa__merchant_types__update_merchant_params__to_json():
    params = UpdateMerchantParams(
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

    expected = {
        "merchantName": "Test Merchant",
        "merchantStreet": "Test street 1",
        "merchantZip": "00112",
        "merchantCity": "Helsinki",
        "merchantEmail": "foo.bar@test.mail",
        "merchantPhone": "+358 50 123 4567",
        "merchantUrl": "https://test.url",
        "merchantTermsOfServiceUrl": "https://test.url/tos",
        "merchantBusinessId": "123456-7",
        "merchantShopId": "test-shop-id",
    }

    assert params.to_json() == expected
