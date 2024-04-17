import uuid
from unittest import mock

import pytest
from django.test.testcases import TestCase

from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.tasks import refund_paid_reservation_task
from tests.factories import PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method

pytestmark = [
    pytest.mark.usefixtures("_setup_verkkokauppa_env_variables"),
]


class RefundPaidReservationTestCase(TestCase):
    def test_does_not_fail_when_reservation_is_missing(self):
        refund_paid_reservation_task(0)

    def test_does_not_fail_when_order_is_missing(self):
        reservation = ReservationFactory.create()
        refund_paid_reservation_task(reservation.pk)

    @patch_method(VerkkokauppaAPIClient.refund_order)
    def test_updates_payment_order_on_success(self):
        reservation = ReservationFactory.create()
        order = PaymentOrderFactory.create(reservation=reservation, remote_id=uuid.uuid4())

        refund = mock.MagicMock()
        refund.refund_id = uuid.uuid4()
        VerkkokauppaAPIClient.refund_order.return_value = refund

        refund_paid_reservation_task(reservation.pk)

        assert VerkkokauppaAPIClient.refund_order.called

        order.refresh_from_db()
        assert order.refund_id == refund.refund_id

    @patch_method(VerkkokauppaAPIClient.refund_order)
    def test_throws_on_refund_call_failure(self):
        reservation = ReservationFactory.create()
        order = PaymentOrderFactory.create(reservation=reservation, remote_id=uuid.uuid4())

        VerkkokauppaAPIClient.refund_order.side_effect = Exception("Test exception")

        with pytest.raises(Exception) as ex:  # noqa: PT011
            refund_paid_reservation_task(reservation.pk)

        assert str(ex.value) == "Test exception"

        order.refresh_from_db()
        assert order.refund_id is None
