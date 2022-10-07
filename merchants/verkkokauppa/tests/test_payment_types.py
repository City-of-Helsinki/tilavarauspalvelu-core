from datetime import datetime
from decimal import Decimal
from uuid import UUID

from assertpy import assert_that
from pytest import raises

from ..payment.exceptions import ParsePaymentError
from ..payment.types import Payment


def test_payment_from_json(get_payment_response):
    payment = Payment.from_json(get_payment_response)
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


def test_product_from_json_raises_exception_if_key_is_missing(get_payment_response):
    get_payment_response.pop("paymentId")
    with raises(ParsePaymentError):
        Payment.from_json(get_payment_response)


def test_product_from_json_raises_exception_if_value_is_invalid(get_payment_response):
    get_payment_response["orderId"] = "invalid-id"
    with raises(ParsePaymentError):
        Payment.from_json(get_payment_response)
