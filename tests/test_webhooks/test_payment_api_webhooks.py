import dataclasses
from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.test import override_settings
from django.urls import reverse

from merchants.models import OrderStatus
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from reservations.choices import ReservationStateChoice
from tests.test_webhooks.helpers import WebhookAPITestCaseBase


@mock.patch("api.webhooks.views.get_payment")
@override_settings(VERKKOKAUPPA_NAMESPACE="tilanvaraus")
class WebhookPaymentAPITestCase(WebhookAPITestCaseBase):
    def get_valid_data(self):
        return {
            "paymentId": self.verkkokauppa_payment.payment_id,
            "orderId": self.verkkokauppa_payment.order_id,
            "namespace": self.verkkokauppa_payment.namespace,
            "eventType": "PAYMENT_PAID",
        }

    @mock.patch("api.webhooks.views.send_confirmation_email")
    def test_returns_200_without_body_on_success(self, mock_send_confirmation_email, mock_get_payment):
        mock_get_payment.return_value = self.verkkokauppa_payment

        response = self.client.post(
            reverse("payment-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)
        assert_that(self.payment_order.payment_id).is_equal_to(str(self.verkkokauppa_payment.payment_id))

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(ReservationStateChoice.CONFIRMED)
        assert_that(mock_send_confirmation_email.called).is_true()

    def test_returns_200_without_body_on_order_already_paid(self, mock_get_payment):
        self.payment_order.status = OrderStatus.PAID
        self.payment_order.save()

        response = self.client.post(
            reverse("payment-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data).is_none()

    @mock.patch("api.webhooks.views.capture_exception")
    def test_returns_400_with_error_on_invalid_payload(self, mock_capture_exception, mock_get_payment):
        data = self.get_valid_data()
        data.pop("eventType")

        response = self.client.post(
            reverse("payment-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)

        expected_error = {"status": 400, "message": "Required field missing: eventType"}
        assert_that(response.data).is_equal_to(expected_error)
        assert mock_capture_exception.called is True

    @mock.patch("api.webhooks.views.capture_exception")
    def test_returns_400_with_error_on_invalid_namespace(self, mock_capture_exception, mock_get_payment):
        data = self.get_valid_data()
        data["namespace"] = "invalid"

        response = self.client.post(
            reverse("payment-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)

        expected_error = {"status": 400, "message": "Invalid namespace"}
        assert_that(response.data).is_equal_to(expected_error)
        assert_that(mock_capture_exception.called).is_true()

    @mock.patch("api.webhooks.views.capture_exception")
    @mock.patch("api.webhooks.views.capture_message")
    def test_returns_400_with_error_on_invalid_payment_state(
        self, mock_capture_message, mock_capture_exception, mock_get_payment
    ):
        self.verkkokauppa_payment = dataclasses.replace(self.verkkokauppa_payment, status="something_else")
        mock_get_payment.return_value = self.verkkokauppa_payment

        response = self.client.post(
            reverse("payment-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)

        expected_error = {"status": 400, "message": "Invalid payment state"}
        assert_that(response.data).is_equal_to(expected_error)
        assert_that(mock_capture_message.called).is_true()
        assert_that(mock_capture_exception.called).is_true()

    def test_returns_404_with_error_on_order_not_found(self, mock_get_payment):
        data = self.get_valid_data()
        data["orderId"] = uuid4()

        response = self.client.post(
            reverse("payment-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(404)

        expected_error = {"status": 404, "message": "Order not found"}
        assert_that(response.data).is_equal_to(expected_error)

    @mock.patch("api.webhooks.views.capture_exception")
    def test_returns_500_with_error_on_payment_fetch_failure(self, mock_capture_exception, mock_get_payment):
        mock_get_payment.side_effect = GetPaymentError("Mock error")

        response = self.client.post(
            reverse("payment-list"),
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
            reverse("payment-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(501)

        expected_error = {"status": 501, "message": "Unsupported type"}
        assert_that(response.data).is_equal_to(expected_error)