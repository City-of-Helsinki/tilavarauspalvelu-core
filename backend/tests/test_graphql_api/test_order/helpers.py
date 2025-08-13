from __future__ import annotations

import uuid
from inspect import cleandoc
from typing import TYPE_CHECKING

from tests.factories import PaymentOrderFactory, ReservationFactory, ReservationUnitFactory

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder


ORDER_QUERY = cleandoc(
    """
        query ($orderUuid: UUID!) {
          order(orderUuid: $orderUuid) {
            orderUuid
            status
            paymentType
            receiptUrl
            checkoutUrl
            refundUuid
            expiresInMinutes
          }
        }
    """
)


def get_order() -> PaymentOrder:
    reservation_unit = ReservationUnitFactory.create()
    reservation = ReservationFactory.create(reservation_unit=reservation_unit)
    return PaymentOrderFactory.create(
        reservation=reservation,
        remote_id=str(uuid.uuid4()),
        refund_id=str(uuid.uuid4()),
        checkout_url="https://example.url/checkout",
        receipt_url="https://example.url/receipt",
        reservation_user_uuid=reservation.user.uuid,
    )
