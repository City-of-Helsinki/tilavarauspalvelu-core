from __future__ import annotations

import uuid

import pytest

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.integrations.verkkokauppa.order.types import WebShopOrderStatus
from tilavarauspalvelu.integrations.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from tilavarauspalvelu.tasks import cancel_payment_order_for_invoice_task

from tests.factories import OrderFactory, PaymentOrderFactory, ReservationFactory
from tests.helpers import patch_method

# Applied to all tests
pytestmark = [
    pytest.mark.django_db,
]


def test_cancel_payment_order_for_invoice__does_not_fail_when_reservation_is_missing():
    cancel_payment_order_for_invoice_task(0)


@patch_method(VerkkokauppaAPIClient.cancel_order)
def test_cancel_payment_order_for_invoice__updates_payment_order_on_success():
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
def test_cancel_payment_order_for_invoice__not_cancelled_on_verkkokauppa_error():
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
