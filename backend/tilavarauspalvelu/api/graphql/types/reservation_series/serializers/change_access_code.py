from __future__ import annotations

from typing import Any

from graphene_django_extensions import NestingModelSerializer
from rest_framework.exceptions import ValidationError
from rest_framework.fields import BooleanField, DateTimeField, IntegerField

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationSeries
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationSeriesChangeAccessCodeSerializer",
]


class ReservationSeriesChangeAccessCodeSerializer(NestingModelSerializer):
    """Change the access code of a reservation series."""

    instance: ReservationSeries

    pk = IntegerField(required=True)

    access_code_generated_at = DateTimeField(allow_null=True, read_only=True)
    access_code_is_active = BooleanField(read_only=True)

    class Meta:
        model = ReservationSeries
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

    def update(self, instance: ReservationSeries, validated_data: dict[str, Any]) -> ReservationSeries:  # noqa: ARG002
        try:
            response = PindoraService.change_access_code(obj=instance)

        except PindoraNotFoundError:
            if instance.allocated_time_slot is None:
                instance.reservations.update(access_code_generated_at=None, access_code_is_active=False)
                return instance

            section = instance.allocated_time_slot.reservation_unit_option.application_section
            Reservation.objects.for_application_section(section).update(
                access_code_generated_at=None,
                access_code_is_active=False,
            )
            return instance

        except ExternalServiceError as error:
            raise ValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        access_code_is_active = response["access_code_is_active"]

        if not access_code_is_active:
            try:
                PindoraService.activate_access_code(obj=instance)
                access_code_is_active = True
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation series: {instance.pk}")

        if instance.allocated_time_slot is not None:
            section = instance.allocated_time_slot.reservation_unit_option.application_section

            if access_code_is_active:
                EmailService.send_seasonal_booking_access_code_changed_email(section)

        return instance
