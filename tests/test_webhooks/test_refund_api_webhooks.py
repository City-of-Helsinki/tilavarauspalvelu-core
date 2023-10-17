import dataclasses
from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.test import override_settings
from django.urls import reverse

from merchants.models import OrderStatus
from merchants.verkkokauppa.payment.exceptions import (
    GetRefundStatusError,
)
from merchants.verkkokauppa.payment.types import RefundStatus
from tests.test_webhooks.helpers import WebhookAPITestCaseBase


@mock.patch("api.webhooks.views.get_refund_status")
@override_settings(VERKKOKAUPPA_NAMESPACE="tilanvaraus")
class WebhookRefundAPITestCase(WebhookAPITestCaseBase):
    def setUp(self) -> None:
        super().setUp()
        self.payment_order.status = OrderStatus.PAID
        self.payment_order.remote_id = self.verkkokauppa_order.order_id
        self.payment_order.refund_id = uuid4()
        self.payment_order.save()

    def get_valid_data(self):
        return {
            "orderId": self.verkkokauppa_order.order_id,
            "refundId": self.payment_order.refund_id,
            "refundPaymentId": uuid4(),
            "namespace": self.verkkokauppa_order.namespace,
            "eventType": "REFUND_PAID",
        }

    def test_refund_returns_200_without_body_on_success(self, mock_get_refund_status):
        mock_get_refund_status.return_value = self.refund_status
        response = self.client.post(
            reverse("refund-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.REFUNDED)

    def test_refund_returns_200_when_order_is_already_handled(self, mock_get_refund_status):
        self.payment_order.status = OrderStatus.REFUNDED
        self.payment_order.save()

        response = self.client.post(
            reverse("refund-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.REFUNDED)

    def test_refund_returns_400_with_no_changes_when_refund_is_not_found(self, mock_get_refund_status):
        mock_get_refund_status.return_value = None

        response = self.client.post(
            reverse("refund-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)
        assert_that(response.data["status"]).is_equal_to(400)
        assert_that(response.data["message"]).is_equal_to("Refund not found")

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)

    def test_refund_returns_400_with_no_changes_when_refund_is_in_invalid_state(self, mock_get_refund_status):
        refund_status = dataclasses.replace(self.refund_status, status=RefundStatus.CANCELLED.value)
        mock_get_refund_status.return_value = refund_status

        response = self.client.post(
            reverse("refund-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)
        assert_that(response.data["status"]).is_equal_to(400)
        assert_that(response.data["message"]).is_equal_to("Invalid refund state")

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)

    def test_refund_returns_500_with_no_changes_when_get_refund_status_fails(self, mock_get_refund_status):
        mock_get_refund_status.side_effect = GetRefundStatusError("mock-error")

        response = self.client.post(
            reverse("refund-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(500)
        assert_that(response.data["status"]).is_equal_to(500)
        assert_that(response.data["message"]).is_equal_to("Problem with upstream service")

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)

    def test_refund_returns_404_with_no_changes_when_order_is_not_found(self, mock_get_refund_status):
        self.payment_order.remote_id = uuid4()
        self.payment_order.save()

        response = self.client.post(
            reverse("refund-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(404)
        assert_that(response.data["status"]).is_equal_to(404)
        assert_that(response.data["message"]).is_equal_to("Order not found")

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)

    @mock.patch("api.webhooks.views.capture_exception")
    def test_refund_returns_400_when_payload_is_invalid(self, mock_capture_exception, mock_get_refund_status):
        data = self.get_valid_data()
        data.pop("refundPaymentId")
        response = self.client.post(
            reverse("refund-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)
        assert_that(response.data["status"]).is_equal_to(400)
        assert_that(response.data["message"]).is_equal_to("Required field missing: refundPaymentId")

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)
        assert_that(mock_capture_exception.called).is_true()

    @mock.patch("api.webhooks.views.capture_exception")
    def test_refund_returns_400_on_invalid_namespace(self, mock_capture_exception, mock_get_refund_status):
        data = self.get_valid_data()
        data["namespace"] = "invalid"

        response = self.client.post(
            reverse("refund-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)
        assert_that(response.data["status"]).is_equal_to(400)
        assert_that(response.data["message"]).is_equal_to("Invalid namespace")

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)
        assert_that(mock_capture_exception.called).is_true()

    def test_refund_returns_501_on_invalid_namespace(self, mock_get_refund_status):
        data = self.get_valid_data()
        data["eventType"] = "invalid"

        response = self.client.post(
            reverse("refund-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(501)
        assert_that(response.data["status"]).is_equal_to(501)
        assert_that(response.data["message"]).is_equal_to("Unsupported type")

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)
