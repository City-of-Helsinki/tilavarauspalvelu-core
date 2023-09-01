import json
from datetime import datetime
from typing import Any, Dict
from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.test import override_settings
from django.utils.timezone import get_default_timezone
from freezegun import freeze_time

from api.graphql.tests.base import GrapheneTestCaseBase
from api.graphql.validation_errors import ValidationErrorCodes
from merchants.models import OrderStatus
from tests.factories import PaymentFactory, PaymentOrderFactory, ReservationFactory


@override_settings(VERKKOKAUPPA_NAMESPACE="tilanvaraus")
@freeze_time("2023-05-04 12:00:00", tz_offset=0)
class RefreshOrderMutationTestCase(GrapheneTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.reservation = ReservationFactory()
        cls.payment_order = PaymentOrderFactory(remote_id=uuid4(), reservation=cls.reservation)

    def setUp(self):
        self.client.force_login(self.general_admin)

    def get_valid_data(self, order_uuid: bool) -> Dict[str, Any]:
        return {
            "orderUuid": order_uuid,
        }

    def get_refresh_order_query(self) -> str:
        return """
        mutation refreshOrder($input: RefreshOrderMutationInput!) {
            refreshOrder(input: $input){
                orderUuid
                status
                reservationPk
            }
        }
        """

    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_refresh_mutation_set_order_to_paid(self, mock_get_payment):
        remote_id = str(self.payment_order.remote_id)
        mock_get_payment.return_value = PaymentFactory(payment_id=remote_id, status="payment_paid_online")

        response = self.query(
            query=self.get_refresh_order_query(),
            input_data=self.get_valid_data(remote_id),
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        result = content.get("data").get("refreshOrder")
        assert_that(result.get("orderUuid")).is_equal_to(remote_id)
        assert_that(result.get("status")).is_equal_to(OrderStatus.PAID.value)
        assert_that(result.get("reservationPk")).is_equal_to(self.reservation.pk)

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.PAID)
        assert_that(self.payment_order.processed_at).is_equal_to(datetime.now().astimezone(get_default_timezone()))

    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_refresh_mutation_set_order_to_cancelled(self, mock_get_payment):
        remote_id = str(self.payment_order.remote_id)
        mock_get_payment.return_value = PaymentFactory(payment_id=remote_id, status="payment_cancelled")

        response = self.query(
            query=self.get_refresh_order_query(),
            input_data=self.get_valid_data(remote_id),
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        result = content.get("data").get("refreshOrder")
        assert_that(result.get("orderUuid")).is_equal_to(remote_id)
        assert_that(result.get("status")).is_equal_to(OrderStatus.CANCELLED.value)
        assert_that(result.get("reservationPk")).is_equal_to(self.reservation.pk)

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.CANCELLED)
        assert_that(self.payment_order.processed_at).is_equal_to(datetime.now().astimezone(get_default_timezone()))

    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_refresh_mutation_skip_update_if_order_is_not_in_updateable_state(self, mock_get_payment):
        self.payment_order.status = OrderStatus.REFUNDED
        self.payment_order.save()

        remote_id = str(self.payment_order.remote_id)

        response = self.query(
            query=self.get_refresh_order_query(),
            input_data=self.get_valid_data(remote_id),
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        result = content.get("data").get("refreshOrder")
        assert_that(result.get("orderUuid")).is_equal_to(remote_id)
        assert_that(result.get("status")).is_equal_to(OrderStatus.REFUNDED.value)
        assert_that(result.get("reservationPk")).is_equal_to(self.reservation.pk)

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.REFUNDED)
        assert_that(self.payment_order.processed_at).is_none()

        assert_that(mock_get_payment.called).is_false()

    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_refresh_mutation_raise_error_when_order_not_found(self, mock_get_payment):
        not_found_remote_id = str(uuid4())
        mock_get_payment.return_value = None

        response = self.query(
            query=self.get_refresh_order_query(),
            input_data=self.get_valid_data(not_found_remote_id),
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        errors = content.get("errors")

        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to("Order not found")
        assert_that(errors[0].get("extensions").get("error_code")).is_equal_to(ValidationErrorCodes.NOT_FOUND.value)

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.DRAFT)
        assert_that(self.payment_order.processed_at).is_none()

    @mock.patch("api.graphql.merchants.merchant_mutations.capture_message")
    @mock.patch("api.graphql.merchants.merchant_mutations.get_payment")
    def test_refresh_mutation_raise_error_when_payment_not_found(self, mock_get_payment, mock_capture_message):
        remote_id = str(self.payment_order.remote_id)
        mock_get_payment.return_value = None

        response = self.query(
            query=self.get_refresh_order_query(),
            input_data=self.get_valid_data(remote_id),
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)

        errors = content.get("errors")
        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to("Unable to check order payment")
        assert_that(errors[0].get("extensions").get("error_code")).is_equal_to(ValidationErrorCodes.NOT_FOUND.value)

        assert_that(mock_capture_message.called).is_true

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.DRAFT)
        assert_that(self.payment_order.processed_at).is_none()

    def test_refresh_mutation_raise_error_when_no_permission(self):
        self.client.force_login(self.regular_joe)
        remote_id = str(self.payment_order.remote_id)

        response = self.query(
            query=self.get_refresh_order_query(),
            input_data=self.get_valid_data(remote_id),
        )

        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        errors = content.get("errors")
        assert_that(len(errors)).is_equal_to(1)
        assert_that(errors[0].get("message")).is_equal_to("No permission to refresh the order")
        assert_that(errors[0].get("extensions").get("error_code")).is_equal_to(ValidationErrorCodes.NO_PERMISSION.value)

        self.payment_order.refresh_from_db()
        assert_that(self.payment_order.status).is_equal_to(OrderStatus.DRAFT)
        assert_that(self.payment_order.processed_at).is_none()
