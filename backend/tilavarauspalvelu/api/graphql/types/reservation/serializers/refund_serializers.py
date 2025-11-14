from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import IntegerField

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import cancel_payment_order_for_invoice_task, refund_payment_order_for_webshop_task

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
        if hasattr(instance, "payment_order"):
            payment_order = instance.payment_order

            match payment_order.status:
                case OrderStatus.PAID_BY_INVOICE:
                    cancel_payment_order_for_invoice_task.delay(payment_order.pk)

                case OrderStatus.PAID:
                    refund_payment_order_for_webshop_task.delay(payment_order.pk)

        return instance
