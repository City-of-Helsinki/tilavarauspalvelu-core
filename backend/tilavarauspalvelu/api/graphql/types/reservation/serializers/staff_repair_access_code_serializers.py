from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation
from utils.external_service.errors import external_service_errors_as_validation_errors

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
        self.instance.validators.validate_reservation_access_type_is_access_code()
        self.instance.validators.validate_reservation_has_not_ended()
        self.instance.validators.validate_not_in_reservation_series()
        return data

    def update(self, instance: Reservation, validated_data: dict[str, Any]) -> Reservation:  # noqa: ARG002
        no_access_code_before = instance.access_code_generated_at is None or not instance.access_code_is_active

        with external_service_errors_as_validation_errors(code=error_codes.PINDORA_ERROR):
            PindoraService.sync_access_code(obj=instance)

        has_access_code_after = instance.access_code_generated_at is not None and instance.access_code_is_active

        if no_access_code_before and has_access_code_after:
            EmailService.send_reservation_access_code_added_email(reservation=instance)

        return instance
