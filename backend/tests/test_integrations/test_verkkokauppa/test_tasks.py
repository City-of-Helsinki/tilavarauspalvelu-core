from __future__ import annotations

import uuid
from unittest import mock

import pytest

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import RefundPaymentError
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.tasks import cancel_reservation_invoice_task, refund_paid_reservation_task

from tests.factories import PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method

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
    order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        status=OrderStatus.PAID,
    )

    mock_refund = mock.MagicMock()
    mock_refund.refund_id = uuid.uuid4()
    VerkkokauppaAPIClient.refund_order.return_value = mock_refund

    refund_paid_reservation_task(reservation.pk)

    assert VerkkokauppaAPIClient.refund_order.call_count == 1

    order.refresh_from_db()
    assert order.refund_id == mock_refund.refund_id
    assert order.status == OrderStatus.REFUNDED


@patch_method(VerkkokauppaAPIClient.refund_order, side_effect=RefundPaymentError("Error"))
def test_verkkokauppa__refund_paid_reservation_task__not_refunded_on_verkkokauppa_error():
    reservation = ReservationFactory.create()
    order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        status=OrderStatus.PAID,
    )

    with pytest.raises(RefundPaymentError):
        refund_paid_reservation_task(reservation.pk)

    assert VerkkokauppaAPIClient.refund_order.call_count == 1

    order.refresh_from_db()
    assert order.refund_id is None
    assert order.status == OrderStatus.PAID


def test_verkkokauppa__cancel_reservation_invoice_task__does_not_fail_when_reservation_is_missing():
    cancel_reservation_invoice_task(0)


def test_verkkokauppa__cancel_reservation_invoice_task__does_not_fail_when_order_is_missing():
    reservation = ReservationFactory.create()
    cancel_reservation_invoice_task(reservation.pk)


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_verkkokauppa__cancel_reservation_invoice_task__updates_payment_order_on_success():
    reservation = ReservationFactory.create()
    order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        reservation_user_uuid=uuid.uuid4(),
        status=OrderStatus.PAID_BY_INVOICE,
    )

    cancel_reservation_invoice_task(reservation.pk)

    assert VerkkokauppaAPIClient.cancel_order.call_count == 1

    order.refresh_from_db()
    assert order.status == OrderStatus.CANCELLED


@patch_method(VerkkokauppaAPIClient.cancel_order, side_effect=CancelOrderError("Error"))
def test_verkkokauppa__cancel_reservation_invoice_task__not_cancelled_on_verkkokauppa_error():
    reservation = ReservationFactory.create()
    order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        reservation_user_uuid=uuid.uuid4(),
        status=OrderStatus.PAID_BY_INVOICE,
    )

    with pytest.raises(CancelOrderError):
        cancel_reservation_invoice_task(reservation.pk)

    assert VerkkokauppaAPIClient.cancel_order.call_count == 1

    order.refresh_from_db()
    assert order.status == OrderStatus.PAID_BY_INVOICE
