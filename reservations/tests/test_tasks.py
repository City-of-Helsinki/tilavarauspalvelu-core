from unittest import mock
from uuid import uuid4

from assertpy import assert_that
from django.test.testcases import TestCase
from pytest import raises

from reservations.tasks import refund_paid_reservation_task
from tests.factories import PaymentOrderFactory, ReservationFactory


class RefundPaidReservationTestCase(TestCase):
    def test_does_not_fail_when_reservation_is_missing(self):
        refund_paid_reservation_task(0)

    def test_does_not_fail_when_order_is_missing(self):
        reservation = ReservationFactory.create()
        refund_paid_reservation_task(reservation.pk)

    @mock.patch("reservations.tasks.refund_order")
    def test_updates_payment_order_on_success(self, mock_refund_order):
        reservation = ReservationFactory.create()
        order = PaymentOrderFactory.create(reservation=reservation, remote_id=uuid4())

        refund = mock.MagicMock()
        refund.refund_id = uuid4()
        mock_refund_order.return_value = refund

        refund_paid_reservation_task(reservation.pk)
        assert_that(mock_refund_order.called).is_true()

        order.refresh_from_db()
        assert_that(order.refund_id).is_equal_to(refund.refund_id)

    @mock.patch("reservations.tasks.refund_order")
    def test_throws_on_refund_call_failure(self, mock_refund_order):
        reservation = ReservationFactory.create()
        order = PaymentOrderFactory.create(reservation=reservation, remote_id=uuid4())

        mock_refund_order.side_effect = Exception("Test exception")

        with raises(Exception) as ex:
            refund_paid_reservation_task(reservation.pk)
        assert_that(str(ex.value)).is_equal_to("Test exception")

        order.refresh_from_db()
        assert_that(order.refund_id).is_none()
