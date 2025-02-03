from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import IntegerField

from tilavarauspalvelu.models import Reservation

__all__ = [
    "StaffRepairReservationAccessCodeSerializer",
]


class StaffRepairReservationAccessCodeSerializer(NestingModelSerializer):
    """
    Synchronize the state of the reservation's access code between Varaamo and Pindora
    to what Varaamo thinks is should be its correct state.
    """

    instance: Reservation

    pk = IntegerField(required=True)

    class Meta:
        model = Reservation
        fields = [
            "pk",
            "access_code_generated_at",
            "access_code_is_active",
        ]
        extra_kwargs = {
            "access_code_generated_at": {"read_only": True},
            "access_code_is_active": {"read_only": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        self.instance.validator.validate_reservation_access_type_is_access_code()
        self.instance.validator.validate_reservation_has_not_ended()
        self.instance.validator.validate_not_in_reservation_series()
        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:  # noqa: ARG002
        instance.actions.repair_reservation_access_code()
        return instance
