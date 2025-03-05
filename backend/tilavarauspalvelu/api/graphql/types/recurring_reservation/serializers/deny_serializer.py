from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import RecurringReservation, ReservationDenyReason
from tilavarauspalvelu.tasks import create_or_update_reservation_statistics, update_affecting_time_spans_task
from utils.date_utils import local_datetime

if TYPE_CHECKING:
    from tilavarauspalvelu.models.reservation.queryset import ReservationQuerySet

__all__ = [
    "ReservationSeriesDenyInputSerializer",
    "ReservationSeriesDenyOutputSerializer",
]


class ReservationSeriesDenyInputSerializer(NestingModelSerializer):
    instance: RecurringReservation

    deny_reason = serializers.IntegerField(required=True)
    handling_details = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = RecurringReservation
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

    def update(self, instance: RecurringReservation, validated_data: dict[str, Any]) -> RecurringReservation:
        now = local_datetime()

        reservations: ReservationQuerySet = instance.reservations.filter(  # type: ignore[attr-defined]
            begin__gt=now,
            state__in=ReservationStateChoice.states_that_can_change_to_deny,
        )

        has_access_code = reservations.requires_active_access_code().exists()

        reservations.update(
            state=ReservationStateChoice.DENIED,
            deny_reason=validated_data["deny_reason"],
            handling_details=validated_data.get("handling_details", ""),
            handled_at=now,
        )

        # Must refresh the materialized view since reservations state changed to 'DENIED'
        if settings.UPDATE_AFFECTING_TIME_SPANS:
            update_affecting_time_spans_task.delay()

        if settings.SAVE_RESERVATION_STATISTICS:
            create_or_update_reservation_statistics.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        EmailService.send_seasonal_reservation_rejected_series_email(reservation_series=instance)

        if has_access_code:
            # Reschedule the reservation series to remove all denied reservations.
            # This might remove leave an empty series, which is fine.
            PindoraService.reschedule_access_code(instance)

        return instance


class ReservationSeriesDenyOutputSerializer(NestingModelSerializer):
    denied = serializers.IntegerField(required=True)
    future = serializers.IntegerField(required=True)

    class Meta:
        model = RecurringReservation
        fields = [
            "denied",
            "future",
        ]
