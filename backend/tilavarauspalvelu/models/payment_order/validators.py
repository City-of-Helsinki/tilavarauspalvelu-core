from __future__ import annotations

import dataclasses
from typing import TYPE_CHECKING

from undine.exceptions import GraphQLValidationError

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import DEFAULT_TIMEZONE, local_date

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder


__all__ = [
    "PaymentOrderValidator",
]


@dataclasses.dataclass(slots=True, frozen=True)
class PaymentOrderValidator:
    payment_order: PaymentOrder

    def validate_order_can_be_refunded(self) -> None:
        if self.payment_order.status == OrderStatus.REFUNDED or self.payment_order.refund_id is not None:
            msg = "Order has already been refunded."
            raise GraphQLValidationError(msg, code=error_codes.ORDER_REFUND_NOT_ALLOWED)

        if self.payment_order.status != OrderStatus.PAID:
            msg = "Only orders paid online can be refunded."
            raise GraphQLValidationError(msg, code=error_codes.ORDER_REFUND_NOT_ALLOWED)

    def validate_order_can_be_cancelled(self) -> None:
        if self.payment_order.status == OrderStatus.CANCELLED:
            msg = "Order has already been cancelled."
            raise GraphQLValidationError(msg, code=error_codes.ORDER_CANCELLATION_NOT_ALLOWED)

        if self.payment_order.status != OrderStatus.PAID_BY_INVOICE:
            msg = "Only orders paid by invoice can be cancelled."
            raise GraphQLValidationError(msg, code=error_codes.ORDER_CANCELLATION_NOT_ALLOWED)

        begin_date = self.payment_order.reservation.begins_at.astimezone(DEFAULT_TIMEZONE).date()

        if local_date() > begin_date:
            msg = "Order cannot be cancelled after its reservation start date."
            raise GraphQLValidationError(msg, code=error_codes.ORDER_CANCELLATION_NOT_ALLOWED)
