from __future__ import annotations

import uuid

import pytest

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.integrations.verkkokauppa.order.types import WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import RefundPaymentError
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.tasks import cancel_payment_order_for_invoice_task, refund_payment_order_for_webshop_task

from tests.factories import OrderFactory, PaymentOrderFactory, RefundFactory, ReservationFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_verkkokauppa__refund_payment_order_for_webshop_task__does_not_fail_when_reservation_is_missing():
    refund_payment_order_for_webshop_task(0)


@patch_method(VerkkokauppaAPIClient.refund_order)
def test_verkkokauppa__refund_payment_order_for_webshop_task__updates_payment_order_on_success():
    reservation = ReservationFactory.create()
    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        status=OrderStatus.PAID,
    )

    refund = RefundFactory.create()
    VerkkokauppaAPIClient.refund_order.return_value = refund

    refund_payment_order_for_webshop_task(payment_order.pk)

    assert VerkkokauppaAPIClient.refund_order.call_count == 1

    payment_order.refresh_from_db()
    assert payment_order.refund_id == refund.refund_id

    # Status will change when refund webhook is received
    assert payment_order.status == OrderStatus.PAID


@patch_method(VerkkokauppaAPIClient.refund_order, side_effect=RefundPaymentError("Error"))
def test_verkkokauppa__refund_payment_order_for_webshop_task__not_refunded_on_verkkokauppa_error():
    reservation = ReservationFactory.create()
    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        status=OrderStatus.PAID,
    )

    with pytest.raises(RefundPaymentError):
        refund_payment_order_for_webshop_task(payment_order.pk)

    assert VerkkokauppaAPIClient.refund_order.call_count == 1

    payment_order.refresh_from_db()
    assert payment_order.refund_id is None
    assert payment_order.status == OrderStatus.PAID


def test_verkkokauppa__cancel_payment_order_for_invoice_task__does_not_fail_when_reservation_is_missing():
    cancel_payment_order_for_invoice_task(0)


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_verkkokauppa__cancel_payment_order_for_invoice_task__updates_payment_order_on_success():
    reservation = ReservationFactory.create()
    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        reservation_user_uuid=uuid.uuid4(),
        status=OrderStatus.PAID_BY_INVOICE,
    )

    order = OrderFactory.create(status=WebShopOrderStatus.CANCELLED)
    VerkkokauppaAPIClient.cancel_order.return_value = order

    cancel_payment_order_for_invoice_task(payment_order.pk)

    assert VerkkokauppaAPIClient.cancel_order.call_count == 1

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.CANCELLED


@patch_method(VerkkokauppaAPIClient.cancel_order, side_effect=CancelOrderError("Error"))
def test_verkkokauppa__cancel_payment_order_for_invoice_task__not_cancelled_on_verkkokauppa_error():
    reservation = ReservationFactory.create()
    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        reservation_user_uuid=uuid.uuid4(),
        status=OrderStatus.PAID_BY_INVOICE,
    )

    with pytest.raises(CancelOrderError):
        cancel_payment_order_for_invoice_task(payment_order.pk)

    assert VerkkokauppaAPIClient.cancel_order.call_count == 1

    payment_order.refresh_from_db()
    assert payment_order.status == OrderStatus.PAID_BY_INVOICE


@patch_method(VerkkokauppaAPIClient.refund_order)
def test_verkkokauppa__refund_payment_order_for_webshop_task__refund_already_issued():
    refund = RefundFactory.create()
    VerkkokauppaAPIClient.refund_order.return_value = refund

    reservation = ReservationFactory.create()
    payment_order = PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=uuid.uuid4(),
        status=OrderStatus.PAID,
        refund_id=refund.refund_id,
    )

    refund_payment_order_for_webshop_task(payment_order.pk)

    assert VerkkokauppaAPIClient.refund_order.call_count == 0
