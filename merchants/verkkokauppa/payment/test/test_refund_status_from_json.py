from datetime import datetime
from unittest import mock
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from django.test import TestCase
from pytest import raises

from merchants.verkkokauppa.payment.exceptions import ParseRefundStatusError
from merchants.verkkokauppa.payment.types import RefundStatusResult

refund_status_json = {
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


class RefundStatusFromJsonTestCase(TestCase):
    def test_refund_status_from_json(self):
        refund_status = RefundStatusResult.from_json(refund_status_json)

        assert_that(refund_status.order_id).is_equal_to(
            UUID("63c0e5b7-a460-38f1-97d8-2ffce25cce31")
        )
        assert_that(refund_status.refund_payment_id).is_equal_to(
            "ea0f16e8-14d7-4510-b83f-1a29494756f0_at_20230329-073612"
        )
        assert_that(refund_status.refund_transaction_id).is_equal_to(
            UUID("61b2d842-ce04-11ed-9991-c7842594818f")
        )

        assert_that(refund_status.namespace).is_equal_to("tilanvaraus")
        assert_that(refund_status.status).is_equal_to("refund_paid_online")
        assert_that(refund_status.created_at).is_equal_to(
            datetime(
                2023, 3, 29, 7, 36, 13, 576000, tzinfo=settings.VERKKOKAUPPA_TIMEZONE
            )
        )

    @mock.patch("merchants.verkkokauppa.payment.types.capture_exception")
    def test_parsing_fails(self, mock_capture_exception):
        with raises(ParseRefundStatusError) as ex:
            data = refund_status_json.copy()
            data["orderId"] = "not-a-uuid"
            RefundStatusResult.from_json(data)

        assert_that(str(ex.value)).is_equal_to(
            "Could not parse refund status: badly formed hexadecimal UUID string"
        )
        assert_that(mock_capture_exception.called).is_true()
