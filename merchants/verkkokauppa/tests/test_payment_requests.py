from copy import deepcopy
from typing import Any
from unittest import mock
from unittest.mock import Mock
from urllib.parse import urljoin
from uuid import UUID

import pytest
from assertpy import assert_that
from django.conf import settings
from django.test.testcases import TestCase
from requests import Timeout

from merchants.verkkokauppa.constants import REQUEST_TIMEOUT_SECONDS
from merchants.verkkokauppa.payment.exceptions import GetPaymentError, RefundPaymentError
from merchants.verkkokauppa.payment.requests import get_payment, get_refund_status, refund_order
from merchants.verkkokauppa.payment.types import Payment, Refund, RefundStatusResult
from merchants.verkkokauppa.tests.mocks import mock_get, mock_post


class GetPaymentRequestsTestCase(TestCase):
    get_payment_response: dict[str, Any] = {
        "paymentId": "08c2d282-eb98-3271-a3fc-81fe200f129b_at_20211115-122645",
        "namespace": "tilavarauspalvelu",
        "orderId": "08c2d282-eb98-3271-a3fc-81fe200f129b",
        "userId": "Esperanza_Daniel23",
        "status": "payment_created",
        "paymentMethod": "nordea",
        "paymentType": "order",
        "totalExclTax": 100,
        "total": 124,
        "taxAmount": 24,
        "description": "Test description",
        "additionalInfo": '{"payment_method": nordea}',
        "token": "354477a1a009a1514fa3cc1132179a60163f5650aaf27ec98bb98158b04e0a63",
        "timestamp": "20211115-122645",
        "paymentMethodLabel": "Nordea",
    }

    def test_get_payment_makes_valid_request(self):
        order_id = UUID(self.get_payment_response["orderId"])
        namespace = self.get_payment_response["namespace"]
        get = mock_get(self.get_payment_response)
        get_payment(order_id, namespace, get)
        get.assert_called_with(
            url=urljoin(settings.VERKKOKAUPPA_PAYMENT_API_URL, f"admin/{order_id}"),
            headers={
                "api-key": settings.VERKKOKAUPPA_API_KEY,
                "namespace": self.get_payment_response["namespace"],
            },
            timeout=REQUEST_TIMEOUT_SECONDS,
        )

    def test_get_payment_returns_payment(self):
        order_id = UUID(self.get_payment_response["orderId"])
        namespace = self.get_payment_response["namespace"]
        payment = get_payment(order_id, namespace, mock_get(self.get_payment_response))
        expected = Payment.from_json(self.get_payment_response)
        assert_that(payment).is_equal_to(expected)

    def test_get_payment_returns_none_when_payment_is_missing(self):
        error_response = {
            "errors": [
                {
                    "code": "failed-to-get-payment-for-order",
                    "message": "Failed to get payment for order",
                }
            ]
        }
        order_id = UUID(self.get_payment_response["orderId"])
        namespace = self.get_payment_response["namespace"]
        payment = get_payment(order_id, namespace, mock_get(error_response, status_code=500))
        assert_that(payment).is_none()

    def test_get_payment_raises_exception_if_key_is_missing(self):
        response = self.get_payment_response.copy()
        order_id = UUID(response.pop("orderId"))
        namespace = self.get_payment_response["namespace"]
        with pytest.raises(GetPaymentError):
            get_payment(order_id, namespace, mock_get(response))

    def test_get_payment_raises_exception_if_value_is_invalid(self):
        response = self.get_payment_response.copy()
        order_id = UUID(response["orderId"])
        response["orderId"] = "invalid-id"
        namespace = response["namespace"]
        with pytest.raises(GetPaymentError):
            get_payment(order_id, namespace, mock_get(response))

    def test_get_payment_raises_exception_on_timeout(self):
        order_id = UUID(self.get_payment_response["orderId"])
        namespace = self.get_payment_response["namespace"]
        with pytest.raises(GetPaymentError):
            get_payment(order_id, namespace, Mock(side_effect=Timeout()))


class RefundPaymentRequestsTestCase(TestCase):
    refund_response: dict[str, Any] = {
        "refunds": [
            {
                "refundId": "6a8f7829-b6c7-4bbd-add2-0a200298a691",
                "orderId": "019c85c4-0887-4199-8440-b129bb3ba10f",
                "namespace": "tilanvaraus",
                "user": "test-user",
                "createdAt": "2021-11-12T12:40:41.873597",
                "status": "confirmed",
                "customerFirstName": "First",
                "customerLastName": "Last",
                "customerEmail": "test@example.com",
                "customerPhone": "+358 50 123 4567",
                "refundReason": "Test reason",
                "items": [],
                "payment": {},
            }
        ],
        "errors": [],
    }

    def test_refund_order_returns_refund(self):
        order_id = UUID(self.refund_response["refunds"][0]["orderId"])
        post = mock_post(self.refund_response, status_code=200)
        refund = refund_order(order_id, post)
        expected = Refund.from_json(self.refund_response["refunds"][0])
        assert_that(refund).is_equal_to(expected)

    @mock.patch("merchants.verkkokauppa.payment.requests.capture_message")
    def test_refund_order_raises_exception_on_non_200_status_code(self, mock_capture):
        order_id = UUID(self.refund_response["refunds"][0]["orderId"])
        post = mock_post({}, status_code=500)

        with pytest.raises(RefundPaymentError) as ex:
            refund_order(order_id, post)

        assert_that(str(ex.value)).is_equal_to("Payment refund failed: problem with upstream service")
        assert_that(mock_capture.called).is_true()

    @mock.patch("merchants.verkkokauppa.payment.requests.capture_message")
    def test_refund_order_raises_exception_on_multi_refund_response(self, mock_capture):
        order_id = UUID(self.refund_response["refunds"][0]["orderId"])

        response = deepcopy(self.refund_response)
        response["refunds"].append({})

        post = mock_post(response, status_code=200)

        with pytest.raises(RefundPaymentError) as ex:
            refund_order(order_id, post)

        assert_that(str(ex.value)).is_equal_to("Refund response refund count expected to be 1 but was 2")
        assert_that(mock_capture.called).is_true()

    @mock.patch("merchants.verkkokauppa.payment.requests.capture_exception")
    def test_refund_order_raises_exception_on_invalid_response(self, mock_capture):
        order_id = UUID(self.refund_response["refunds"][0]["orderId"])

        response = deepcopy(self.refund_response)
        response["refunds"][0]["refundId"] = "not-a-uuid"

        post = mock_post(response, status_code=200)

        with pytest.raises(RefundPaymentError) as ex:
            refund_order(order_id, post)

        assert_that(str(ex.value)).is_equal_to(
            "Payment refund failed: Could not parse refund: badly formed hexadecimal UUID string"
        )
        assert_that(mock_capture.called).is_true()


class GetRefundStatusRequestsTestCase(TestCase):
    refund_status_response: dict[str, Any] = {
        "refundPaymentId": "ea0f16e8-14d7-4510-b83f-1a29494756f0_at_20230329-073612",
        "refundTransactionId": "61b2d842-ce04-11ed-9991-c7842594818f",
        "namespace": "tilanvaraus",
        "orderId": "63c0e5b7-a460-38f1-97d8-2ffce25cce31",
        "userId": "qwerty",
        "status": "refund_paid_online",
        "refundMethod": "nordea",
        "refundGateway": "online-paytrail",
        "totalExclTax": 100,
        "total": 124,
        "refundId": "ea0f16e8-14d7-4510-b83f-1a29494756f0",
        "taxAmount": 24,
        "timestamp": "20230329-073613",
        "createdAt": "2023-03-29T07:36:13.576",
        "updatedAt": None,
    }

    def test_get_refund_status_returns_status(self):
        order_id = UUID(self.refund_status_response["orderId"])
        namespace = self.refund_status_response["namespace"]
        get = mock_get(self.refund_status_response, status_code=200)
        refund_status = get_refund_status(order_id, namespace, get)
        expected = RefundStatusResult.from_json(self.refund_status_response)
        assert_that(refund_status).is_equal_to(expected)
