from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import IntegerField

from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import refund_paid_reservation_task

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
        self.instance.validator.validate_reservation_is_paid()
        self.instance.validator.validate_reservation_state_allows_refunding()
        self.instance.validator.validate_reservation_has_been_paid()
        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:
        instance = super().update(instance=instance, validated_data=validated_data)
        refund_paid_reservation_task.delay(instance.pk)
        return instance
