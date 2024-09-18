import uuid
from datetime import datetime

import pytest
from django.conf import settings

from tests.helpers import patch_method
from tilavarauspalvelu.utils.verkkokauppa.payment.exceptions import ParseRefundError
from tilavarauspalvelu.utils.verkkokauppa.payment.types import Refund
from utils.sentry import SentryLogger

refund_json = {
    "refundId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
    "orderId": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
    "namespace": "tilavaraus",
    "user": "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6",
    "createdAt": "2021-02-25T10:22:59.000",
    "status": "confirmed",
    "customerFirstName": "First",
    "customerLastName": "Last",
    "customerEmail": "test@example.com",
    "customerPhone": "+358 50 123 4567",
    "refundReason": "Test reason",
    "items": [],  # Not useful for us, ignored
    "payment": {},  # Not useful for us, ignored
}


def test_verkkokauppa__refund__from_json():
    refund = Refund.from_json(refund_json)
    assert refund.refund_id == uuid.UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
    assert refund.order_id == uuid.UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
    assert refund.namespace == "tilavaraus"
    assert refund.user == "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6"
    assert refund.created_at == datetime(2021, 2, 25, 10, 22, 59, tzinfo=settings.VERKKOKAUPPA_TIMEZONE)
    assert refund.status == "confirmed"
    assert refund.customer_first_name == "First"
    assert refund.customer_last_name == "Last"
    assert refund.customer_email == "test@example.com"
    assert refund.customer_phone == "+358 50 123 4567"
    assert refund.refund_reason == "Test reason"


def test_verkkokauppa__refund__from_json__optional_fields_not_included():
    data = refund_json.copy()
    data.pop("customerFirstName")
    data.pop("customerLastName")
    data.pop("customerEmail")
    data.pop("customerPhone")
    data.pop("refundReason")
    refund = Refund.from_json(data)

    assert refund.namespace == "tilavaraus"
    assert refund.user == "b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6"
    assert refund.created_at == datetime(2021, 2, 25, 10, 22, 59, tzinfo=settings.VERKKOKAUPPA_TIMEZONE)

    assert refund.status == "confirmed"
    assert refund.customer_first_name is None
    assert refund.customer_last_name is None
    assert refund.customer_email is None
    assert refund.customer_phone is None
    assert refund.refund_reason is None


@patch_method(SentryLogger.log_exception)
def test_verkkokauppa__refund__from_json__parsing_fails():
    data = refund_json.copy()
    data["refundId"] = "not-a-uuid"
    with pytest.raises(ParseRefundError) as ex:
        Refund.from_json(data)

    assert str(ex.value) == "Could not parse refund: badly formed hexadecimal UUID string"
    assert SentryLogger.log_exception.call_count == 1
