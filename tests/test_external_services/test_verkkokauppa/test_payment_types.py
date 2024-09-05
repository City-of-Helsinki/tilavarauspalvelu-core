import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

import pytest
from django.conf import settings

from merchants.verkkokauppa.payment.exceptions import ParsePaymentError
from merchants.verkkokauppa.payment.types import Payment
from tests.helpers import patch_method
from utils.sentry import SentryLogger

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


def test_verkkokauppa__payment_types__payment__from_json():
    payment = Payment.from_json(get_payment_response)
    assert payment == Payment(
        payment_id="08c2d282-eb98-3271-a3fc-81fe200f129b_at_20211115-122645",
        namespace="tilavarauspalvelu",
        order_id=uuid.UUID("08c2d282-eb98-3271-a3fc-81fe200f129b"),
        user_id="Esperanza_Daniel23",
        status="payment_created",
        payment_method="nordea",
        payment_type="order",
        total_excl_tax=Decimal("100"),
        total=Decimal("124"),
        tax_amount=Decimal("24"),
        description="Test description",
        additional_info='{"payment_method": nordea}',
        token="354477a1a009a1514fa3cc1132179a60163f5650aaf27ec98bb98158b04e0a63",
        timestamp=datetime(2021, 11, 15, 12, 26, 45, tzinfo=settings.VERKKOKAUPPA_TIMEZONE),
        payment_method_label="Nordea",
    )


@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__payment_types__payment__from_json__raises_exception_if_key_is_missing():
    response = get_payment_response.copy()
    response.pop("paymentId")
    with pytest.raises(ParsePaymentError):
        Payment.from_json(response)

    assert SentryLogger.log_exception.call_count == 1


@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__payment_types__payment__from_json__raises_exception_if_value_is_invalid():
    response = get_payment_response.copy()
    response["orderId"] = "invalid-id"
    with pytest.raises(ParsePaymentError):
        Payment.from_json(response)

    assert SentryLogger.log_exception.call_count == 1
