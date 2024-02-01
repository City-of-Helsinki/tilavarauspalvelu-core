from datetime import datetime
from unittest import mock
from uuid import UUID

import pytest
from django.conf import settings
from django.test import TestCase

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
    @staticmethod
    def test_refund_status_from_json():
        refund_status = RefundStatusResult.from_json(refund_status_json)

        assert refund_status.order_id == UUID("63c0e5b7-a460-38f1-97d8-2ffce25cce31")
        assert refund_status.refund_payment_id == "ea0f16e8-14d7-4510-b83f-1a29494756f0_at_20230329-073612"
        assert refund_status.refund_transaction_id == UUID("61b2d842-ce04-11ed-9991-c7842594818f")
        assert refund_status.namespace == "tilanvaraus"
        assert refund_status.status == "refund_paid_online"
        assert refund_status.created_at == datetime(
            2023, 3, 29, 7, 36, 13, 576000, tzinfo=settings.VERKKOKAUPPA_TIMEZONE
        )

    @mock.patch("merchants.verkkokauppa.payment.types.log_exception_to_sentry")
    def test_parsing_fails(self, mock_log_exception_to_sentry):
        data = refund_status_json.copy()
        data["orderId"] = "not-a-uuid"

        with pytest.raises(ParseRefundStatusError) as ex:
            RefundStatusResult.from_json(data)

        assert str(ex.value) == "Could not parse refund status: badly formed hexadecimal UUID string"
        assert mock_log_exception_to_sentry.called is True
