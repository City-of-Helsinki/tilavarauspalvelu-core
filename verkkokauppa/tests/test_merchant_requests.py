from typing import Any, Dict
from unittest.mock import Mock
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from requests import Timeout

from ..constants import REQUEST_TIMEOUT_SECONDS
from ..merchants.exceptions import (
    CreateMerchantError,
    GetMerchantsError,
    UpdateMerchantError,
)
from ..merchants.requests import (
    create_merchant,
    get_merchant,
    get_merchants,
    update_merchant,
)
from ..merchants.types import (
    CreateMerchantParams,
    Merchant,
    MerchantInfo,
    UpdateMerchantParams,
)
from .mocks import mock_get, mock_post


class MerchantRequestsBaseTestCase(TestCase):
    create_merchant_params: CreateMerchantParams = CreateMerchantParams(
        name="Test Merchant",
        street="Test street 1",
        zip="00112",
        city="Helsinki",
        email="foo.bar@test.mail",
        phone="+358 50 123 4567",
        url="https://test.url",
        tos_url="https://test.url/tos",
        business_id="123456-7",
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
    )

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
    }

    get_merchants_response: Dict[str, Any] = {
        "0": {
            "merchantId": "7107df38-5985-39c9-8c83-ffe18bff24f5",
            "namespace": "tilanvaraus",
            "createdAt": "2022-09-26T10:11:12.000",
            "updatedAt": "2022-09-27T10:11:12.000",
            "configurations": [
                {"key": "merchantName", "value": "Test Merchant", "restricted": False},
                {
                    "key": "merchantStreet",
                    "value": "Test Street 1",
                    "restricted": False,
                },
                {"key": "merchantZip", "value": "00112", "restricted": False},
                {"key": "merchantCity", "value": "Helsinki", "restricted": False},
                {
                    "key": "merchantEmail",
                    "value": "foo.bar@test.mail",
                    "restricted": False,
                },
                {
                    "key": "merchantPhone",
                    "value": "+358 50 123 4567",
                    "restricted": False,
                },
                {
                    "key": "merchantUrl",
                    "value": "https://test.url",
                    "restricted": False,
                },
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
            ],
        },
        "1": {
            "merchantId": "0312c2f7-3ed6-409e-84e3-ae21196e685d",
            "namespace": "tilanvaraus",
            "createdAt": "2022-07-26T10:11:12.000",
            "updatedAt": "2022-07-27T10:11:12.000",
            "configurations": [
                {
                    "key": "merchantName",
                    "value": "Test Merchant 2",
                    "restricted": False,
                },
                {
                    "key": "merchantStreet",
                    "value": "Test Street 2",
                    "restricted": False,
                },
                {"key": "merchantZip", "value": "99887", "restricted": False},
                {"key": "merchantCity", "value": "Vantaa", "restricted": False},
                {
                    "key": "merchantEmail",
                    "value": "foo.bar.2@test.mail",
                    "restricted": False,
                },
                {
                    "key": "merchantPhone",
                    "value": "+358 40 876 5432",
                    "restricted": False,
                },
                {
                    "key": "merchantUrl",
                    "value": "https://test.url.2",
                    "restricted": False,
                },
                {
                    "key": "merchantTermsOfServiceUrl",
                    "value": "https://test.url/tos2",
                    "restricted": False,
                },
                {"key": "merchantBusinessId", "value": "765432-1", "restricted": False},
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
            ],
        },
    }


class CreateMerchantRequestTestCase(MerchantRequestsBaseTestCase):
    def test_create_merchant_makes_valid_request(self):
        post = mock_post(self.mutation_merchant_response)
        create_merchant(self.create_merchant_params, post)
        post.assert_called_with(
            url=(
                settings.VERKKOKAUPPA_MERCHANT_API_URL
                + "/create/merchant/"
                + settings.VERKKOKAUPPA_MERCHANT_NAMESPACE
            ),
            json=self.create_merchant_params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_create_merchant_returns_merchant(self):
        response = self.mutation_merchant_response
        merchant = create_merchant(self.create_merchant_params, mock_post(response))
        expected = Merchant.from_json(response)
        assert_that(merchant).is_equal_to(expected)

    def test_create_merchant_raises_exception_if_merchant_id_is_missing(self):
        response = self.mutation_merchant_response.copy()
        response.pop("merchantId")
        assert_that(create_merchant).raises(CreateMerchantError).when_called_with(
            self.create_merchant_params, mock_post(response)
        )

    def test_create_merchant_raises_exception_if_merchant_id_is_invalid(self):
        response = self.mutation_merchant_response.copy()
        response["merchantId"] = "invalid-id"
        assert_that(create_merchant).raises(CreateMerchantError).when_called_with(
            self.create_merchant_params, mock_post(response)
        )

    def test_create_merchant_raises_exception_if_status_code_is_not_201(self):
        post = mock_post(self.mutation_merchant_response, status_code=500)
        assert_that(create_merchant).raises(CreateMerchantError).when_called_with(
            self.create_merchant_params, post
        )


class UpdateMerchantRequestTestCase(MerchantRequestsBaseTestCase):
    def test_update_merchant_makes_valid_request(self):
        post = mock_post(self.mutation_merchant_response, status_code=200)
        update_merchant(
            UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
            self.update_merchant_params,
            post,
        )
        post.assert_called_with(
            url=(
                settings.VERKKOKAUPPA_MERCHANT_API_URL
                + "/update/merchant/"
                + settings.VERKKOKAUPPA_MERCHANT_NAMESPACE
                + "/7107df38-5985-39c9-8c83-ffe18bff24f5"
            ),
            json=self.update_merchant_params.to_json(),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_update_merchant_returns_merchant(self):
        merchant = update_merchant(
            UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
            self.update_merchant_params,
            mock_post(self.mutation_merchant_response, status_code=200),
        )
        expected = Merchant.from_json(self.mutation_merchant_response)
        assert_that(merchant).is_equal_to(expected)

    def test_update_merchant_raises_exception_if_merchant_id_is_missing(self):
        response = self.mutation_merchant_response.copy()
        response.pop("merchantId")
        assert_that(update_merchant).raises(UpdateMerchantError).when_called_with(
            UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
            self.update_merchant_params,
            mock_post(response),
        )

    def test_update_merchant_raises_exception_if_merchant_id_is_invalid(self):
        response = self.mutation_merchant_response.copy()
        response["merchantId"] = "invalid-id"
        assert_that(update_merchant).raises(UpdateMerchantError).when_called_with(
            UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
            self.update_merchant_params,
            mock_post(response),
        )

    def test_update_merchant_raises_exception_if_status_code_is_not_200(self):
        post = mock_post(self.mutation_merchant_response, status_code=500)
        assert_that(update_merchant).raises(UpdateMerchantError).when_called_with(
            UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
            self.update_merchant_params,
            post,
        )

    def test_update_merchant_raises_exception_if_status_code_is_404(self):
        post = mock_post({}, status_code=404)
        assert_that(update_merchant).raises(UpdateMerchantError).when_called_with(
            UUID("7107df38-5985-39c9-8c83-ffe18bff24f5"),
            self.update_merchant_params,
            post,
        )


class GetMerchantsRequestTestCase(MerchantRequestsBaseTestCase):
    def test_get_merchants_makes_valid_request(self):
        get = mock_get(self.get_merchants_response)
        get_merchants(get)
        get.assert_called_with(
            url=(
                settings.VERKKOKAUPPA_MERCHANT_API_URL
                + "/list/merchants/"
                + settings.VERKKOKAUPPA_MERCHANT_NAMESPACE
            ),
            headers={"api-key": settings.VERKKOKAUPPA_API_KEY},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_get_merchants_returns_merchants(self):
        merchants = get_merchants(mock_get(self.get_merchants_response))

        merchant_1 = Merchant.from_json(self.get_merchants_response["0"])
        merchant_2 = Merchant.from_json(self.get_merchants_response["1"])
        expected = [merchant_1, merchant_2]

        assert_that(merchants).is_equal_to(expected)

    def test_get_merchants_raises_exception_if_merchant_id_is_missing(self):
        response = {
            "0": self.get_merchants_response["0"].copy(),
            "1": self.get_merchants_response["1"].copy(),
        }
        response["0"].pop("merchantId")
        assert_that(get_merchants).raises(GetMerchantsError).when_called_with(
            mock_get(response)
        )

    def test_get_merchants_raises_exception_on_timeout(self):
        assert_that(get_merchants).raises(GetMerchantsError).when_called_with(
            Mock(side_effect=Timeout())
        )


class GetMerchantRequestTestCase(MerchantRequestsBaseTestCase):
    def test_get_merchant_returns_merchant(self):
        merchant = get_merchant(
            UUID("0312c2f7-3ed6-409e-84e3-ae21196e685d"),
            mock_get(self.get_merchant_response),
        )
        expected = MerchantInfo.from_json(self.get_merchant_response)
        assert_that(merchant).is_equal_to(expected)

    def test_get_merchant_returns_none(self):
        error_response = {
            "errors": [
                {
                    "code": "failed-to-fetch-merchant-configurations",
                    "message": "Failed to fetch - Merchant not found.",
                }
            ]
        }
        merchant = get_merchant(
            UUID("0312c2f7-3ed6-409e-84e3-ae21196e685d"),
            mock_get(error_response, status_code=404),
        )
        assert_that(merchant).is_none()
