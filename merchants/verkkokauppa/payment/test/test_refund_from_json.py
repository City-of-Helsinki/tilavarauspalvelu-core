from datetime import datetime
from unittest import mock
from uuid import UUID

from assertpy import assert_that
from django.conf import settings
from django.test import TestCase
from pytest import raises

from merchants.verkkokauppa.payment.exceptions import ParseRefundError
from merchants.verkkokauppa.payment.types import Refund

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


class RefundFromJsonTestCase(TestCase):
    def test_refund_from_json(self):
        refund = Refund.from_json(refund_json)
        assert_that(refund.refund_id).is_equal_to(UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6"))
        assert_that(refund.order_id).is_equal_to(UUID("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6"))
        assert_that(refund.namespace).is_equal_to("tilavaraus")
        assert_that(refund.user).is_equal_to("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
        assert_that(refund.created_at).is_equal_to(
            datetime(2021, 2, 25, 10, 22, 59, tzinfo=settings.VERKKOKAUPPA_TIMEZONE)
        )
        assert_that(refund.status).is_equal_to("confirmed")
        assert_that(refund.customer_first_name).is_equal_to("First")
        assert_that(refund.customer_last_name).is_equal_to("Last")
        assert_that(refund.customer_email).is_equal_to("test@example.com")
        assert_that(refund.customer_phone).is_equal_to("+358 50 123 4567")
        assert_that(refund.refund_reason).is_equal_to("Test reason")

    def test_optional_fields_not_included(self):
        data = refund_json.copy()
        data.pop("customerFirstName")
        data.pop("customerLastName")
        data.pop("customerEmail")
        data.pop("customerPhone")
        data.pop("refundReason")
        refund = Refund.from_json(data)

        assert_that(refund.namespace).is_equal_to("tilavaraus")
        assert_that(refund.user).is_equal_to("b6b6b6b6-b6b6-b6b6-b6b6-b6b6b6b6b6b6")
        assert_that(refund.created_at).is_equal_to(
            datetime(2021, 2, 25, 10, 22, 59, tzinfo=settings.VERKKOKAUPPA_TIMEZONE)
        )
        assert_that(refund.status).is_equal_to("confirmed")
        assert_that(refund.customer_first_name).is_none()
        assert_that(refund.customer_last_name).is_none()
        assert_that(refund.customer_email).is_none()
        assert_that(refund.customer_phone).is_none()
        assert_that(refund.refund_reason).is_none()

    @mock.patch("merchants.verkkokauppa.payment.types.capture_exception")
    def test_parsing_fails(self, mock_capture_exception):
        with raises(ParseRefundError) as ex:
            data = refund_json.copy()
            data["refundId"] = "not-a-uuid"
            Refund.from_json(data)

        assert_that(str(ex.value)).is_equal_to("Could not parse refund: badly formed hexadecimal UUID string")
        assert_that(mock_capture_exception.called).is_true()
