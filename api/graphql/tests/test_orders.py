import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional
from unittest import mock
from uuid import UUID

import freezegun
import snapshottest
from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.utils.timezone import get_default_timezone
from rest_framework.test import APIClient

from api.graphql.tests.base import GrapheneTestCaseBase
from merchants.models import OrderStatus, PaymentOrder
from merchants.tests.factories import PaymentOrderFactory
from merchants.verkkokauppa.payment.exceptions import GetPaymentError
from merchants.verkkokauppa.payment.test.factories import PaymentFactory
from reservation_units.tests.factories import ReservationUnitFactory
from reservations.models import STATE_CHOICES
from reservations.tests.factories import ReservationFactory

NOW = datetime(2023, 5, 10, 13, 0, 0, tzinfo=timezone.utc).astimezone(get_default_timezone())


@freezegun.freeze_time(NOW)
class OrderQueryTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.api_client = APIClient()
        cls.reservation_unit = ReservationUnitFactory.create(name="Test reservation unit")
        cls.reservation = ReservationFactory.create(
            name="Test reservation",
            reservation_unit=[cls.reservation_unit],
            user=cls.regular_joe,
        )
        cls.order = PaymentOrderFactory.create(
            reservation=cls.reservation,
            remote_id="b3fef99e-6c18-422e-943d-cf00702af53e",
        )

    @classmethod
    def get_order_query(cls, order_uuid: Optional[str] = None) -> str:
        if not order_uuid:
            order_uuid = cls.order.remote_id

        return (
            """
            query {
                order(orderUuid: "%s") {
                    orderUuid
                    status
                    paymentType
                    receiptUrl
                    checkoutUrl
                    reservationPk
                    refundId
                }
            }
            """
            % order_uuid
        )

    def test_returns_none_when_not_authenticated(self):
        response = self.query(self.get_order_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_returns_order_when_user_owns_reservation(self):
        self.client.force_login(self.regular_joe)

        response = self.query(self.get_order_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_returns_order_when_user_can_handle_reservations(self):
        self.client.force_login(self.general_admin)

        response = self.query(self.get_order_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    def test_returns_refund_id_when_it_exists(self):
        self.order.refund_id = UUID("d55db3a0-0786-4259-ab9e-c4211cae162e")
        self.order.save()

        self.client.force_login(self.general_admin)

        response = self.query(self.get_order_query())
        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

    @override_settings(VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES=5)
    def test_checkout_url_not_visible_when_expired(self):
        self.order.checkout_url = "https://example.url/checkout"
        self.order.save()

        self.client.force_login(self.general_admin)

        response = self.query(self.get_order_query())

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("order").get("checkoutUrl")).is_equal_to("https://example.url/checkout")

        with freezegun.freeze_time(NOW + timedelta(minutes=6)):
            response = self.query(self.get_order_query())
            assert_that(response.status_code).is_equal_to(200)
            content = json.loads(response.content)
            assert_that(content.get("errors")).is_none()
            assert_that(content.get("data").get("order").get("checkoutUrl")).is_none()

    @override_settings(VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES=5)
    def test_checkout_url_not_visible_when_not_draft(self):
        self.order.checkout_url = "https://example.url/checkout"
        self.order.status = OrderStatus.CANCELLED
        self.order.save()

        self.client.force_login(self.general_admin)

        response = self.query(self.get_order_query())

        assert_that(response.status_code).is_equal_to(200)
        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("order").get("checkoutUrl")).is_none()


class RefreshOrderMutationTestCase(GrapheneTestCaseBase, snapshottest.TestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.api_client = APIClient()
        cls.reservation_unit = ReservationUnitFactory.create(name="Test reservation unit")
        cls.reservation = ReservationFactory.create(
            name="Test reservation",
            reservation_unit=[cls.reservation_unit],
            user=cls.regular_joe,
            state=STATE_CHOICES.CREATED,
        )
        cls.payment_order = PaymentOrderFactory.create(
            reservation=cls.reservation,
            remote_id="b3fef99e-6c18-422e-943d-cf00702af53e",
            status=OrderStatus.DRAFT,
            reservation_user_uuid=cls.regular_joe.uuid,
        )

    @classmethod
    def get_refresh_order_query(cls, order_uuid: Optional[str] = None) -> str:
        if not order_uuid:
            order_uuid = cls.payment_order.remote_id

        return """
            mutation refreshOrderMutation($input: RefreshOrderMutationInput!){
                refreshOrder(input: $input) {
                    orderUuid
                    status
                }
            }
            """

    @classmethod
    def get_valid_data(cls) -> Dict[str, str]:
        return {"orderUuid": str(cls.payment_order.remote_id)}

    def test_payment_order_not_found_returns_error(self):
        self.payment_order.delete()
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.assertMatchSnapshot(content)

    @mock.patch("api.graphql.merchants.merchant_mutations.capture_message")
    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_payment_not_found_returns_error_with_no_changes(self, mock_get_payment, mock_capture):
        mock_get_payment.return_value = None

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.assertMatchSnapshot(content)

        assert_that(mock_capture.called).is_true()

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(self.payment_order.status)

    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_status_created_cause_no_changes(self, mock_get_payment):
        mock_get_payment.return_value = PaymentFactory.create(status="payment_created")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(self.payment_order.status)

    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_status_authorized_cause_no_changes(self, mock_get_payment):
        mock_get_payment.return_value = PaymentFactory.create(status="authorized")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(self.payment_order.status)

    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_status_payment_cancelled_cause_cancellation(self, mock_get_payment):
        mock_get_payment.return_value = PaymentFactory.create(status="payment_cancelled")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(OrderStatus.CANCELLED)

    @mock.patch("api.graphql.merchants.merchant_mutations.send_confirmation_email")
    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_status_paid_online_cause_paid_marking_and_no_notification(self, mock_get_payment, mock_send_email):
        mock_get_payment.return_value = PaymentFactory.create(status="payment_paid_online")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        assert_that(mock_send_email.called).is_false()

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(OrderStatus.PAID)

    @mock.patch("api.graphql.merchants.merchant_mutations.send_confirmation_email")
    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_status_paid_online_sends_notification_if_reservation_waiting_for_payment(
        self, mock_get_payment, mock_send_email
    ):
        mock_get_payment.return_value = PaymentFactory.create(status="payment_paid_online")

        self.reservation.state = STATE_CHOICES.WAITING_FOR_PAYMENT
        self.reservation.save()

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        assert_that(mock_send_email.called).is_true()

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(OrderStatus.PAID)

    @mock.patch("api.graphql.merchants.merchant_mutations.capture_exception")
    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_get_payment_exceptions_are_logged(self, mock_get_payment, mock_capture):
        mock_get_payment.side_effect = GetPaymentError("Mock error")

        self.client.force_login(self.regular_joe)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.assertMatchSnapshot(content)

        assert_that(mock_capture.called).is_true()

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(self.payment_order.status)

    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_reservation_managers_can_call(self, mock_get_payment):
        mock_get_payment.return_value = PaymentFactory.create(status="payment_created")

        self.client.force_login(self.general_admin)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        self.assertMatchSnapshot(content)

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(self.payment_order.status)

    def test_unauthenticated_call_returns_an_error(self):
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.assertMatchSnapshot(content)

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(self.payment_order.status)

    def test_unauthorized_call_returns_an_error(self):
        other_user = get_user_model().objects.create(
            username="jcage",
            first_name="Johnny",
            last_name="Cage",
            email="johnny.cage@earthrealm.com",
        )

        self.client.force_login(other_user)
        response = self.query(self.get_refresh_order_query(), input_data=self.get_valid_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()
        self.assertMatchSnapshot(content)

        order = PaymentOrder.objects.get(pk=self.payment_order.pk)
        assert_that(order.status).is_equal_to(self.payment_order.status)
