from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import cancel_reservation_invoice_task, refund_paid_reservation_task

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder

__all__ = [
    "ReservationRefundSerializer",
]


class ReservationRefundSerializer(NestingModelSerializer):
    instance: Reservation

    pk = IntegerField(required=True)

    class Meta:
        model = Reservation
        fields = [
            "pk",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        self.instance.validators.validate_reservation_is_paid()
        self.instance.validators.validate_reservation_state_allows_refunding_or_cancellation()
        self.instance.validators.validate_reservation_order_allows_refunding_or_cancellation()
        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:  # noqa: ARG002
        payment_order: PaymentOrder = instance.payment_order.first()

        match payment_order.status:
            case OrderStatus.PAID_BY_INVOICE:
                cancel_reservation_invoice_task.delay(instance.pk)

            case OrderStatus.PAID:
                refund_paid_reservation_task.delay(instance.pk)

        return instance
