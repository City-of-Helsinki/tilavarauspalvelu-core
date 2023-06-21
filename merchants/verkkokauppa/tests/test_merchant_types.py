from datetime import datetime
from typing import Any, Dict
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase

from merchants.verkkokauppa.merchants.exceptions import ParseMerchantError
from merchants.verkkokauppa.merchants.types import (
    CreateMerchantParams,
    Merchant,
    MerchantInfo,
    UpdateMerchantParams,
)


class MerchantTypesBaseTestCase(TestCase):
    mutation_merchant_response: Dict[str, Any] = {
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

    get_merchant_response: Dict[str, Any] = {
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


class MerchantTypesTestCase(MerchantTypesBaseTestCase):
    def test_merchant_info_from_json(self):
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
        actual = MerchantInfo.from_json(self.get_merchant_response)
        assert_that(actual).is_equal_to(expected)

    def test_merchant_from_json(self):
        expected = Merchant(
            id=UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
            namespace="tilanvaraus",
            created_at=datetime(
                2022, 9, 26, 10, 11, 12, tzinfo=settings.VERKKOKAUPPA_TIMEZONE
            ),
            updated_at=datetime(
                2022, 9, 27, 10, 11, 12, tzinfo=settings.VERKKOKAUPPA_TIMEZONE
            ),
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
        actual = Merchant.from_json(self.mutation_merchant_response)
        assert_that(expected).is_equal_to(actual)

    def test_merchant_from_json_empty_configurations(self):
        expected = Merchant(
            id=UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
            namespace="tilanvaraus",
            created_at=datetime(
                2022, 9, 26, 10, 11, 12, tzinfo=settings.VERKKOKAUPPA_TIMEZONE
            ),
            updated_at=datetime(
                2022, 9, 27, 10, 11, 12, tzinfo=settings.VERKKOKAUPPA_TIMEZONE
            ),
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
        response = self.mutation_merchant_response.copy()
        response["configurations"] = []

        actual = Merchant.from_json(response)
        assert_that(expected).is_equal_to(actual)

    def test_merchant_from_json_missing_field(self):
        response = self.mutation_merchant_response.copy()
        response.pop("merchantId")
        assert_that(Merchant.from_json).raises(ParseMerchantError).when_called_with(
            response
        )

    def test_create_merchant_params_to_json(self):
        params = CreateMerchantParams(
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

        assert_that(params.to_json()).is_equal_to(expected)

    def test_update_merchant_params_to_json(self):
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

        assert_that(params.to_json()).is_equal_to(expected)
