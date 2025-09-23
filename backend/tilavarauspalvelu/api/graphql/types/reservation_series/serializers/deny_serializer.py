from __future__ import annotations

from contextlib import suppress
from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.models import ReservationDenyReason, ReservationSeries
from tilavarauspalvelu.tasks import create_statistics_for_reservations_task
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime
from utils.external_service.errors import external_service_errors_as_validation_errors

if TYPE_CHECKING:
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet

__all__ = [
    "ReservationSeriesDenyInputSerializer",
    "ReservationSeriesDenyOutputSerializer",
]


class ReservationSeriesDenyInputSerializer(NestingModelSerializer):
    instance: ReservationSeries

    deny_reason = serializers.IntegerField(required=True)
    handling_details = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = ReservationSeries
        fields = [
            "pk",
            "deny_reason",
            "handling_details",
        ]
        extra_kwargs = {
            "deny_reason": {"required": True},
            "handling_details": {"required": False},
        }

    @staticmethod
    def validate_deny_reason(value: int) -> int:
        if ReservationDenyReason.objects.filter(pk=value).exists():
            return value
        msg = f"Deny reason with pk {value} does not exist."
        raise ValidationError(msg, code=error_codes.DENY_REASON_DOES_NOT_EXIST)

    def update(self, instance: ReservationSeries, validated_data: dict[str, Any]) -> ReservationSeries:
        now = local_datetime()

        reservations: ReservationQuerySet = instance.reservations.filter(  # type: ignore[attr-defined]
            begins_at__gt=now,
            state__in=ReservationStateChoice.states_that_can_change_to_deny,
        )

        has_access_code = reservations.requires_active_access_code().exists()

        with transaction.atomic():
            reservations.update(
                state=ReservationStateChoice.DENIED,
                deny_reason=validated_data["deny_reason"],
                handling_details=validated_data.get("handling_details", ""),
                handled_at=now,
            )

            # If any reservations had access codes, reschedule the series to remove all denied reservations.
            # This might leave an empty series, which is fine.
            if has_access_code:
                with (
                    external_service_errors_as_validation_errors(code=error_codes.PINDORA_ERROR),
                    suppress(PindoraNotFoundError),
                ):
                    PindoraService.reschedule_access_code(instance)

        # Must refresh the materialized view since reservations state changed to 'DENIED'
        # TODO: Disabled for now, since it might contribute to timeouts in production.
        #  Refresh still happens on a background task every 2 minutes.
        #  if settings.UPDATE_AFFECTING_TIME_SPANS:  # noqa: ERA001,RUF100
        #      update_affecting_time_spans_task.delay()  # noqa: ERA001,RUF100

        if settings.SAVE_RESERVATION_STATISTICS:
            create_statistics_for_reservations_task.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        if instance.allocated_time_slot is not None:
            EmailService.send_seasonal_booking_denied_series_email(instance)

        return instance


class ReservationSeriesDenyOutputSerializer(NestingModelSerializer):
    denied = serializers.IntegerField(required=True)
    future = serializers.IntegerField(required=True)

    class Meta:
        model = ReservationSeries
        fields = [
            "denied",
            "future",
        ]
