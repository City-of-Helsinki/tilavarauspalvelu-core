import dataclasses
from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.test import override_settings
from django.urls import reverse

from merchants.models import OrderStatus
from merchants.verkkokauppa.order.exceptions import GetOrderError
from tests.test_webhooks.helpers import WebhookAPITestCaseBase


@mock.patch("api.webhooks.views.get_order")
@override_settings(VERKKOKAUPPA_NAMESPACE="tilanvaraus")
class WebhookOrderAPITestCase(WebhookAPITestCaseBase):
    def get_valid_data(self):
        return {
            "orderId": self.verkkokauppa_payment.order_id,
            "namespace": self.verkkokauppa_payment.namespace,
            "eventType": "ORDER_CANCELLED",
        }

    def test_returns_200_without_body_on_success(self, mock_get_order):
        mock_get_order.return_value = self.verkkokauppa_order

        response = self.client.post(
            reverse("order-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.CANCELLED)

    def test_returns_200_without_body_on_order_is_already_handled(self, mock_get_order):
        self.payment_order.status = OrderStatus.PAID_MANUALLY
        self.payment_order.save()

        response = self.client.post(
            reverse("order-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID_MANUALLY)

    @mock.patch("api.webhooks.views.capture_exception")
    def test_returns_400_with_error_on_invalid_payload(self, mock_capture_exception, mock_get_payment):
        data = self.get_valid_data()
        data.pop("eventType")

        response = self.client.post(
            reverse("order-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)

        expected_error = {"status": 400, "message": "Required field missing: eventType"}
        assert_that(response.data).is_equal_to(expected_error)
        assert_that(mock_capture_exception.called).is_true()

    @mock.patch("api.webhooks.views.capture_exception")
    def test_returns_400_with_error_on_invalid_namespace(self, mock_capture_exception, mock_get_payment):
        data = self.get_valid_data()
        data["namespace"] = "invalid"

        response = self.client.post(
            reverse("order-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)

        expected_error = {"status": 400, "message": "Invalid namespace"}
        assert_that(response.data).is_equal_to(expected_error)
        assert_that(mock_capture_exception.called).is_true()

    @mock.patch("api.webhooks.views.capture_exception")
    @mock.patch("api.webhooks.views.capture_message")
    def test_returns_400_with_error_on_invalid_order_state(
        self, mock_capture_message, mock_capture_exception, mock_get_order
    ):
        self.verkkokauppa_order = dataclasses.replace(self.verkkokauppa_order, status="something_else")
        mock_get_order.return_value = self.verkkokauppa_order

        response = self.client.post(
            reverse("order-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)

        expected_error = {"status": 400, "message": "Invalid order state"}
        assert_that(response.data).is_equal_to(expected_error)
        assert_that(mock_capture_message.called).is_true()
        assert_that(mock_capture_exception.called).is_true()

    def test_returns_404_with_error_on_order_not_found(self, mock_get_payment):
        data = self.get_valid_data()
        data["orderId"] = uuid4()

        response = self.client.post(
            reverse("order-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(404)

        expected_error = {"status": 404, "message": "Order not found"}
        assert_that(response.data).is_equal_to(expected_error)

    @mock.patch("api.webhooks.views.capture_exception")
    def test_returns_500_with_error_on_order_fetch_failure(self, mock_capture_exception, mock_get_order):
        mock_get_order.side_effect = GetOrderError("Mock error")

        response = self.client.post(
            reverse("order-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(500)

        expected_error = {"status": 500, "message": "Problem with upstream service"}
        assert_that(response.data).is_equal_to(expected_error)
        assert_that(mock_capture_exception.called).is_true()

    def test_returns_501_with_error_on_invalid_type(self, mock_get_payment):
        data = self.get_valid_data()
        data["eventType"] = "invalid"

        response = self.client.post(
            reverse("order-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(501)

        expected_error = {"status": 501, "message": "Unsupported type"}
        assert_that(response.data).is_equal_to(expected_error)
