from __future__ import annotations

import uuid
from copy import deepcopy
from typing import Any
from urllib.parse import urljoin

import pytest
from django.conf import settings
from requests import Timeout

from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError, RefundPaymentError
from tilavarauspalvelu.integrations.verkkokauppa.payment.types import (
    Payment,
    Refund,
    RefundStatusResult,
    WebShopPaymentGateway,
    WebShopPaymentStatus,
)
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient

from tests.helpers import ResponseMock, patch_method

get_payment_response: dict[str, Any] = {
    "paymentId": "08c2d282-eb98-3271-a3fc-81fe200f129b_at_20211115-122645",
    "namespace": "tilavarauspalvelu",
    "orderId": "08c2d282-eb98-3271-a3fc-81fe200f129b",
    "userId": "Esperanza_Daniel23",
    "status": WebShopPaymentStatus.CREATED.value,
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
    "paymentGateway": WebShopPaymentGateway.PAYTRAIL.value,
}


get_payment_404_response: dict[str, Any] = {
    "errors": [
        {
            "code": "failed-to-get-payment-for-order",
            "message": "Failed to get payment for order",
        },
    ],
}


@patch_method(
    VerkkokauppaAPIClient.request,
    return_value=ResponseMock(status_code=200, json_data=get_payment_response),
)
def test_verkkokauppa__get_payment__makes_valid_request():
    order_uuid = uuid.UUID(get_payment_response["orderId"])

    payment = VerkkokauppaAPIClient.get_payment(order_uuid=order_uuid)

    VerkkokauppaAPIClient.request.assert_called_with(
        method="get",
        url=urljoin(settings.VERKKOKAUPPA_PAYMENT_API_URL, f"admin/{order_uuid}"),
        params=None,
        headers={
            "api-key": settings.VERKKOKAUPPA_API_KEY,
            "namespace": settings.VERKKOKAUPPA_NAMESPACE,
        },
    )

    expected = Payment.from_json(get_payment_response)
    assert payment == expected


@patch_method(
    VerkkokauppaAPIClient.request,
    return_value=ResponseMock(
        status_code=500,  # This is correct, see `VerkkokauppaAPIClient.handle_500_error`
        json_data=get_payment_404_response,
    ),
)
def test_verkkokauppa__get_payment__returns_none_when_payment_is_missing():
    order_uuid = uuid.UUID(get_payment_response["orderId"])

    payment = VerkkokauppaAPIClient.get_payment(order_uuid=order_uuid)
    assert payment is None


@patch_method(VerkkokauppaAPIClient.request)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__get_payment__raises_exception_if_key_is_missing():
    response = get_payment_response.copy()
    order_uuid = uuid.UUID(response.pop("orderId"))
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=200, json_data=response)

    with pytest.raises(GetPaymentError):
        VerkkokauppaAPIClient.get_payment(order_uuid=order_uuid)

    assert SentryLogger.log_exception.call_count == 1


@patch_method(VerkkokauppaAPIClient.request)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__get_payment__raises_exception_if_value_is_invalid():
    order_uuid = uuid.UUID(get_payment_response["orderId"])

    response = get_payment_response.copy()
    response["orderId"] = "invalid-id"

    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=200, json_data=response)

    with pytest.raises(GetPaymentError):
        VerkkokauppaAPIClient.get_payment(order_uuid=order_uuid)

    assert SentryLogger.log_exception.call_count == 1


@patch_method(VerkkokauppaAPIClient.request, side_effect=Timeout())
def test_verkkokauppa__get_payment__raises_exception_on_timeout():
    order_uuid = uuid.UUID(get_payment_response["orderId"])
    with pytest.raises(GetPaymentError):
        VerkkokauppaAPIClient.get_payment(order_uuid=order_uuid)


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


@patch_method(
    VerkkokauppaAPIClient.request,
    return_value=ResponseMock(status_code=200, json_data=refund_status_response),
)
def test_verkkokauppa__get_refund_status__returns_status():
    order_uuid = uuid.UUID(refund_status_response["orderId"])
    refund_status = VerkkokauppaAPIClient.get_refund_status(order_uuid=order_uuid)
    expected = RefundStatusResult.from_json(refund_status_response)
    assert refund_status == expected


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


@patch_method(
    VerkkokauppaAPIClient.request,
    return_value=ResponseMock(status_code=200, json_data=refund_response),
)
def test_verkkokauppa__refund_order__returns_refund():
    order_uuid = uuid.UUID(refund_response["refunds"][0]["orderId"])
    refund = VerkkokauppaAPIClient.refund_order(order_uuid=order_uuid)
    expected = Refund.from_json(refund_response["refunds"][0])
    assert refund == expected


@patch_method(VerkkokauppaAPIClient.request, return_value=ResponseMock(status_code=500, json_data={}))
@patch_method(SentryLogger.log_message)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__refund_order__raises_exception_on_non_200_status_code():
    order_uuid = uuid.UUID(refund_response["refunds"][0]["orderId"])

    with pytest.raises(RefundPaymentError) as err:
        VerkkokauppaAPIClient.refund_order(order_uuid=order_uuid)

    msg = "Payment refund failed: GET request to VERKKOKAUPPA (http://example.com) failed with status 500."
    assert str(err.value) == msg
    assert SentryLogger.log_message.call_count == 1
    assert SentryLogger.log_exception.call_count == 1


@patch_method(SentryLogger.log_message)
@patch_method(VerkkokauppaAPIClient.request)
def test_verkkokauppa__refund_order__raises_exception_on_multi_refund_response():
    order_uuid = uuid.UUID(refund_response["refunds"][0]["orderId"])

    response = deepcopy(refund_response)
    response["refunds"].append({})

    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=200, json_data=response)

    with pytest.raises(RefundPaymentError) as err:
        VerkkokauppaAPIClient.refund_order(order_uuid=order_uuid)

    assert str(err.value) == "Refund response refund count expected to be 1 but was 2"
    assert SentryLogger.log_message.call_count == 1


@patch_method(VerkkokauppaAPIClient.request)
@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__refund_order__raises_exception_on_invalid_response():
    order_uuid = uuid.UUID(refund_response["refunds"][0]["orderId"])

    response = deepcopy(refund_response)
    response["refunds"][0]["refundId"] = "not-a-uuid"
    VerkkokauppaAPIClient.request.return_value = ResponseMock(status_code=200, json_data=response)

    with pytest.raises(RefundPaymentError) as err:
        VerkkokauppaAPIClient.refund_order(order_uuid=order_uuid)

    assert str(err.value) == "Payment refund failed: Could not parse refund: badly formed hexadecimal UUID string"

    assert SentryLogger.log_exception.call_count == 2
