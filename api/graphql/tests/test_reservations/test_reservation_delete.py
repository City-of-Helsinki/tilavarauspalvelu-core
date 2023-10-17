import datetime
import json
from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.contrib.auth import get_user_model
from django.utils.timezone import get_default_timezone

from api.graphql.tests.test_reservations.base import ReservationTestCaseBase
from merchants.models import OrderStatus
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from tests.factories import OrderFactory, PaymentOrderFactory, ReservationFactory


class ReservationDeleteTestCase(ReservationTestCaseBase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()

        cls.reservation = ReservationFactory(
            reservation_unit=[cls.reservation_unit],
            begin=datetime.datetime.now(tz=get_default_timezone()),
            end=(datetime.datetime.now(tz=get_default_timezone()) + datetime.timedelta(hours=1)),
            state=ReservationStateChoice.CREATED,
            user=cls.regular_joe,
            reservee_email="email@reservee",
        )

    def get_delete_query(self):
        return """
            mutation deleteReservation($input: ReservationDeleteMutationInput!) {
                deleteReservation(input: $input){
                    deleted
                    errors
                }
            }
        """

    def get_delete_input_data(self):
        return {"pk": self.reservation.id}

    def test_general_admin_can_delete(self):
        self.client.force_login(self.general_admin)

        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteReservation").get("errors")).is_none()
        assert_that(content.get("data").get("deleteReservation").get("deleted")).is_true()

        assert_that(Reservation.objects.filter(pk=self.reservation.pk).exists()).is_false()

    def test_user_can_delete(self):
        self.client.force_login(self.regular_joe)

        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteReservation").get("errors")).is_none()
        assert_that(content.get("data").get("deleteReservation").get("deleted")).is_true()

        assert_that(Reservation.objects.filter(pk=self.reservation.pk).exists()).is_false()

    def test_waiting_for_payment_can_be_deleted(self):
        self.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
        self.reservation.save()
        self.client.force_login(self.regular_joe)

        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(content.get("data").get("deleteReservation").get("errors")).is_none()
        assert_that(content.get("data").get("deleteReservation").get("deleted")).is_true()

        assert_that(Reservation.objects.filter(pk=self.reservation.pk).exists()).is_false()

    @mock.patch("api.graphql.types.reservations.mutations.cancel_order")
    def test_call_webshop_cancel_and_mark_order_cancelled_on_delete(self, mock_cancel_order):
        mock_cancel_order.return_value = OrderFactory(status="cancelled")

        self.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
        self.reservation.save()

        payment_order = PaymentOrderFactory.create(
            remote_id=uuid4(), reservation=self.reservation, status=OrderStatus.DRAFT
        )

        self.client.force_login(self.regular_joe)

        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(mock_cancel_order.called).is_true()

        payment_order.refresh_from_db()
        assert_that(payment_order.status).is_equal_to(OrderStatus.CANCELLED)

    @mock.patch("api.graphql.types.reservations.mutations.cancel_order")
    def test_dont_call_webshop_cancel_when_order_is_already_cancelled(self, mock_cancel_order):
        self.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
        self.reservation.save()

        payment_order = PaymentOrderFactory.create(
            remote_id=uuid4(),
            reservation=self.reservation,
            status=OrderStatus.CANCELLED,
        )

        self.client.force_login(self.regular_joe)

        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(mock_cancel_order.called).is_false()

        payment_order.refresh_from_db()
        assert_that(payment_order.status).is_equal_to(OrderStatus.CANCELLED)

    @mock.patch("api.graphql.types.reservations.mutations.cancel_order")
    def test_do_not_mark_order_cancelled_if_webshop_call_fails(self, mock_cancel_order):
        mock_cancel_order.return_value = OrderFactory(status="draft")

        self.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
        self.reservation.save()

        payment_order = PaymentOrderFactory.create(
            remote_id=uuid4(), reservation=self.reservation, status=OrderStatus.DRAFT
        )

        self.client.force_login(self.regular_joe)

        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()
        assert_that(mock_cancel_order.called).is_true()

        payment_order.refresh_from_db()
        assert_that(payment_order.status).is_equal_to(OrderStatus.DRAFT)

    @mock.patch("api.graphql.types.reservations.mutations.capture_exception")
    @mock.patch("api.graphql.types.reservations.mutations.cancel_order")
    def test_log_error_on_cancel_order_failure_but_mark_order_cancelled(
        self, mock_cancel_order, mock_capture_exceptions
    ):
        mock_cancel_order.side_effect = CancelOrderError("mock-error")

        self.reservation.state = ReservationStateChoice.WAITING_FOR_PAYMENT
        self.reservation.save()

        payment_order = PaymentOrderFactory.create(
            remote_id=uuid4(), reservation=self.reservation, status=OrderStatus.DRAFT
        )

        self.client.force_login(self.regular_joe)

        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_none()

        payment_order.refresh_from_db()
        assert_that(payment_order.status).is_equal_to(OrderStatus.CANCELLED)

        assert_that(mock_cancel_order.called).is_true()
        assert_that(mock_capture_exceptions.called).is_true()

    def test_cannot_delete_when_status_not_created_nor_waiting_for_payment(self):
        self.client.force_login(self.general_admin)

        self.reservation.state = ReservationStateChoice.CONFIRMED
        self.reservation.save()
        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(Reservation.objects.filter(pk=self.reservation.pk).exists()).is_true()

    def test_other_user_cannot_delete(self):
        other_guy = get_user_model().objects.create(
            username="other",
            first_name="oth",
            last_name="er",
            email="oth.er@foo.com",
        )
        self.client.force_login(other_guy)

        response = self.query(self.get_delete_query(), input_data=self.get_delete_input_data())
        assert_that(response.status_code).is_equal_to(200)

        content = json.loads(response.content)
        assert_that(content.get("errors")).is_not_none()

        assert_that(Reservation.objects.filter(pk=self.reservation.pk).exists()).is_true()
