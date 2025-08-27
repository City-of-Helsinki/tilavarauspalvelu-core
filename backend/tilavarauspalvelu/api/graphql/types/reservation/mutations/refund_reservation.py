from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.tasks import cancel_payment_order_for_invoice_task, refund_payment_order_for_webshop_task

__all__ = [
    "ReservationRefundMutation",
]


class ReservationRefundMutation(MutationType[Reservation], kind="update"):
    """Allows staff to refund a reservation after denying it."""

    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> Reservation:
        user = info.context.user
        if not user.permissions.can_manage_reservation(instance, reserver_needs_role=True):
            msg = "No permission to refund this reservation."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_reservation_is_paid()
        instance.validators.validate_reservation_state_allows_refunding_or_cancellation()
        instance.validators.validate_reservation_order_allows_refunding_or_cancellation()

        if hasattr(instance, "payment_order"):
            payment_order = instance.payment_order

            match payment_order.status:
                case OrderStatus.PAID_BY_INVOICE:
                    cancel_payment_order_for_invoice_task.delay(payment_order.pk)

                case OrderStatus.PAID:
                    refund_payment_order_for_webshop_task.delay(payment_order.pk)

        return instance
