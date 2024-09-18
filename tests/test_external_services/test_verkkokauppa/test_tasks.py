import uuid
from unittest import mock

import pytest

from reservations.tasks import refund_paid_reservation_task
from tests.factories import PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method
from tilavarauspalvelu.utils.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_verkkokauppa__refund_paid_reservation_task__does_not_fail_when_reservation_is_missing():
    refund_paid_reservation_task(0)


def test_verkkokauppa__refund_paid_reservation_task__does_not_fail_when_order_is_missing():
    reservation = ReservationFactory.create()
    refund_paid_reservation_task(reservation.pk)


@patch_method(VerkkokauppaAPIClient.refund_order)
def test_verkkokauppa__refund_paid_reservation_task__updates_payment_order_on_success():
    reservation = ReservationFactory.create()
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=uuid.uuid4())

    mock_refund = mock.MagicMock()
    mock_refund.refund_id = uuid.uuid4()
    VerkkokauppaAPIClient.refund_order.return_value = mock_refund

    refund_paid_reservation_task(reservation.pk)

    assert VerkkokauppaAPIClient.refund_order.called

    order.refresh_from_db()
    assert order.refund_id == mock_refund.refund_id


@patch_method(VerkkokauppaAPIClient.refund_order, side_effect=Exception("Test exception"))
def test_verkkokauppa__refund_paid_reservation_task__throws_on_refund_call_failure():
    reservation = ReservationFactory.create()
    order = PaymentOrderFactory.create(reservation=reservation, remote_id=uuid.uuid4())

    with pytest.raises(Exception) as ex:  # noqa: PT011
        refund_paid_reservation_task(reservation.pk)

    assert VerkkokauppaAPIClient.refund_order.called
    assert str(ex.value) == "Test exception"

    order.refresh_from_db()
    assert order.refund_id is None
