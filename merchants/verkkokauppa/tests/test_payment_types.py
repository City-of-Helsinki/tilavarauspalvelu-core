from datetime import datetime
from decimal import Decimal
from typing import Any, Dict
from uuid import UUID

from assertpy import assert_that
from django.test.testcases import TestCase
from pytest import raises

from ..payment.exceptions import ParsePaymentError
from ..payment.types import Payment


class PaymentTestCase(TestCase):
    get_payment_response: Dict[str, Any] = {
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

    def test_payment_from_json(self):
        payment = Payment.from_json(self.get_payment_response)
        assert_that(payment).is_equal_to(
            Payment(
                payment_id="08c2d282-eb98-3271-a3fc-81fe200f129b_at_20211115-122645",
                namespace="tilavarauspalvelu",
                order_id=UUID("08c2d282-eb98-3271-a3fc-81fe200f129b"),
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
                timestamp=datetime(2021, 11, 15, 12, 26, 45),
                payment_method_label="Nordea",
            )
        )

    def test_product_from_json_raises_exception_if_key_is_missing(self):
        response = self.get_payment_response.copy()
        response.pop("paymentId")
        with raises(ParsePaymentError):
            Payment.from_json(response)

    def test_product_from_json_raises_exception_if_value_is_invalid(self):
        response = self.get_payment_response.copy()
        response["orderId"] = "invalid-id"
        with raises(ParsePaymentError):
            Payment.from_json(response)
