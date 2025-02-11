from __future__ import annotations

from contextlib import suppress
from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import IntegerField

from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraClientError, PindoraNotFoundError
from tilavarauspalvelu.models import Reservation

__all__ = [
    "StaffChangeReservationAccessCodeSerializer",
]


class StaffChangeReservationAccessCodeSerializer(NestingModelSerializer):
    """Change the access code of a reservation."""

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
        self.instance.validator.validate_reservation_has_access_code()
        self.instance.validator.validate_reservation_state_allows_access_code_change()
        self.instance.validator.validate_reservation_type_allows_access_code_change()
        self.instance.validator.validate_reservation_has_not_ended()
        self.instance.validator.validate_not_in_reservation_series()
        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:
        try:
            PindoraClient.change_reservation_access_code(reservation=instance)
        except PindoraNotFoundError:
            instance.access_code_generated_at = None
            instance.access_code_is_active = False
        else:
            if instance.access_code_should_be_active:
                with suppress(PindoraClientError):
                    PindoraClient.activate_reservation_access_code(reservation=instance)
                    instance.access_code_is_active = True

        return super().update(instance=instance, validated_data=validated_data)
