from __future__ import annotations

import uuid

import pytest

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import RefundPaymentError
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.tasks import refund_payment_order_for_webshop_task

from tests.factories import PaymentOrderFactory, RefundFactory, ReservationFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_refund_payment_order_for_webshop__does_not_fail_when_reservation_is_missing():
    refund_payment_order_for_webshop_task(0)


@patch_method(VerkkokauppaAPIClient.refund_order)
def test_refund_payment_order_for_webshop__updates_payment_order_on_success():
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
def test_refund_payment_order_for_webshop__not_refunded_on_verkkokauppa_error():
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


@patch_method(VerkkokauppaAPIClient.refund_order)
def test_refund_payment_order_for_webshop__refund_already_issued():
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
