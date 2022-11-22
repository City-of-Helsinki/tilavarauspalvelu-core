import dataclasses
from datetime import datetime
from decimal import Decimal
from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from merchants.models import PaymentStatus
from merchants.tests.factories import PaymentOrderFactory
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.types import Payment
from reservations.models import STATE_CHOICES
from reservations.tests.factories import ReservationFactory


@mock.patch("api.webhook_api.views.get_payment")
@override_settings(VERKKOKAUPPA_NAMESPACE="tilanvaraus")
class WebhookPaymentAPITestCase(TestCase):
    def setUp(self) -> None:
        self.client = APIClient()
        self.reservation = ReservationFactory.create(
            state=STATE_CHOICES.WAITING_FOR_PAYMENT
        )
        self.payment_order = PaymentOrderFactory.create(
            reservation=self.reservation, status=PaymentStatus.DRAFT
        )
        self.verkkokauppa_payment = Payment(
            payment_id=uuid4(),
            namespace="tilanvaraus",
            order_id=self.payment_order.remote_id,
            user_id=uuid4(),
            status="payment_paid_online",
            payment_method="creditcards",
            payment_type="order",
            total_excl_tax=Decimal("100"),
            total=Decimal("124"),
            tax_amount=Decimal("24"),
            description=None,
            additional_info='{"payment_method": creditcards}',
            token=uuid4(),
            timestamp=datetime.now(),
            payment_method_label="Visa",
        )

    def get_client(self):
        return APIClient()

    def get_valid_data(self):
        return {
            "paymentId": self.verkkokauppa_payment.payment_id,
            "orderId": self.verkkokauppa_payment.order_id,
            "namespace": self.verkkokauppa_payment.namespace,
            "type": "PAYMENT_PAID",
            "timestamp": self.verkkokauppa_payment.timestamp.isoformat(),
        }

    @mock.patch("api.webhook_api.views.send_confirmation_email")
    def test_returns_200_without_body_on_success(
        self, mock_send_confirmation_email, mock_get_payment
    ):
        mock_get_payment.return_value = self.verkkokauppa_payment

        response = self.client.post(
            reverse("payment-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data).is_none()

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(PaymentStatus.PAID)
        assert_that(self.payment_order.payment_id).is_equal_to(
            str(self.verkkokauppa_payment.payment_id)
        )

        self.reservation.refresh_from_db()
        assert_that(self.reservation.state).is_equal_to(STATE_CHOICES.CONFIRMED)
        assert_that(mock_send_confirmation_email.called).is_true()

    def test_returns_200_without_body_on_order_already_paid(self, mock_get_payment):
        self.payment_order.status = PaymentStatus.PAID
        self.payment_order.save()

        response = self.client.post(
            reverse("payment-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(200)
        assert_that(response.data).is_none()

    def test_returns_400_with_error_on_invalid_payload(self, mock_get_payment):
        data = self.get_valid_data()
        data.pop("type")

        response = self.client.post(
            reverse("payment-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(400)

        expected_error = {"status": 400, "message": "Required field missing: type"}
        assert_that(response.data).is_equal_to(expected_error)

    def test_returns_400_with_error_on_invalid_namespace(self, mock_get_payment):
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

    @mock.patch("api.webhook_api.views.capture_message")
    def test_returns_400_with_error_on_invalid_payment_state(
        self, mock_capture_message, mock_get_payment
    ):
        self.verkkokauppa_payment = dataclasses.replace(
            self.verkkokauppa_payment, status="something_else"
        )
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

    @mock.patch("api.webhook_api.views.capture_message")
    def test_returns_500_with_error_on_payment_fetch_failure(
        self, mock_capture_message, mock_get_payment
    ):
        mock_get_payment.side_effect = GetPaymentError("Mock error")

        response = self.client.post(
            reverse("payment-list"),
            data=self.get_valid_data(),
            format="json",
        )
        assert_that(response.status_code).is_equal_to(500)

        expected_error = {"status": 500, "message": "Problem with upstream service"}
        assert_that(response.data).is_equal_to(expected_error)
        assert_that(mock_capture_message.called).is_true()

    def test_returns_501_with_error_on_invalid_type(self, mock_get_payment):
        data = self.get_valid_data()
        data["type"] = "invalid"

        response = self.client.post(
            reverse("payment-list"),
            data=data,
            format="json",
        )
        assert_that(response.status_code).is_equal_to(501)

        expected_error = {"status": 501, "message": "Unsupported type"}
        assert_that(response.data).is_equal_to(expected_error)
