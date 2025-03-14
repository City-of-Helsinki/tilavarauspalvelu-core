from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.fields import BooleanField, DateTimeField, IntegerField

from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import RecurringReservation

__all__ = [
    "ReservationSeriesRepairAccessCodeSerializer",
]


class ReservationSeriesRepairAccessCodeSerializer(NestingModelSerializer):
    """
    Synchronize the state of the reservation series' access code between Varaamo and Pindora
    to what Varaamo thinks is should be its correct state.
    """

    instance: RecurringReservation

    pk = IntegerField(required=True)

    access_code_generated_at = DateTimeField(allow_null=True, read_only=True)
    access_code_is_active = BooleanField(read_only=True)

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "access_code_generated_at",
            "access_code_is_active",
        ]

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        self.instance.validators.validate_series_has_ongoing_or_future_reservations()
        self.instance.validators.validate_has_access_code_access_type()
        self.instance.validators.validate_requires_active_access_code()
        return data

    def update(self, instance: RecurringReservation, validated_data: dict[str, Any]) -> RecurringReservation:  # noqa: ARG002
        PindoraService.sync_access_code(obj=instance)

        if instance.allocated_time_slot is not None:
            # Send email to all reservation series in the same application section where the access code is active.
            # TODO: Should send a single email with all of the series' info.
            section = instance.allocated_time_slot.reservation_unit_option.application_section

            series: RecurringReservation
            for series in section.actions.get_reservation_series().should_have_active_access_code():
                EmailService.send_seasonal_reservation_modified_series_access_code_email(series)

        return instance
