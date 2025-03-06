from __future__ import annotations

from contextlib import suppress
from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import IntegerField

from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.models import Reservation

__all__ = [
    "StaffChangeReservationAccessCodeSerializer",
]

from utils.external_service.errors import ExternalServiceError


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
        self.instance.validators.validate_reservation_has_access_code()
        self.instance.validators.validate_reservation_state_allows_access_code_change()
        self.instance.validators.validate_reservation_type_allows_access_code_change()
        self.instance.validators.validate_reservation_has_not_ended()
        self.instance.validators.validate_not_in_reservation_series()
        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:  # noqa: ARG002
        try:
            PindoraService.change_access_code(obj=instance)

        except PindoraNotFoundError:
            instance.access_code_generated_at = None
            instance.access_code_is_active = False
            instance.save(update_fields=["access_code_generated_at", "access_code_is_active"])
            return instance

        if instance.access_code_should_be_active:
            if not instance.access_code_is_active:
                with suppress(ExternalServiceError):
                    PindoraService.activate_access_code(obj=instance)

            EmailService.send_reservation_modified_access_code_email(reservation=instance)

        return instance
