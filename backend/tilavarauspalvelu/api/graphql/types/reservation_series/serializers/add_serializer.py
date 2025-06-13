from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING

from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import ReservationSeries
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.typing import ReservationSeriesAddData


__all__ = [
    "ReservationSeriesAddReservationSerializer",
]


class ReservationSeriesAddReservationSerializer(NestingModelSerializer):
    """Add a reservation to a reservation series."""

    instance: ReservationSeries

    pk = serializers.IntegerField(required=True)

    begins_at = serializers.DateTimeField(required=True, write_only=True)
    ends_at = serializers.DateTimeField(required=True, write_only=True)

    buffer_time_before = serializers.DurationField(required=False, write_only=True)
    buffer_time_after = serializers.DurationField(required=False, write_only=True)

    class Meta:
        model = ReservationSeries
        fields = [
            "pk",
            "begins_at",
            "ends_at",
            "buffer_time_before",
            "buffer_time_after",
        ]

    def validate(self, data: ReservationSeriesAddData) -> ReservationSeriesAddData:
        self.instance.validators.validate_has_reservations()

        reservation_unit = self.instance.reservation_unit
        first_reservation: Reservation = self.instance.reservations.first()
        reservation_type = first_reservation.type

        begins_at: datetime.datetime = data["begins_at"].astimezone(DEFAULT_TIMEZONE)
        ends_at: datetime.datetime = data["ends_at"].astimezone(DEFAULT_TIMEZONE)

        if reservation_unit.reservation_block_whole_day:
            data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begins_at)
            data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(ends_at)

        # Buffers should not be used for blocking reservations
        elif reservation_type == ReservationTypeChoice.BLOCKED:
            data["buffer_time_before"] = datetime.timedelta()
            data["buffer_time_after"] = datetime.timedelta()

        buffer_time_before = data.setdefault("buffer_time_before", reservation_unit.buffer_time_before)
        buffer_time_after = data.setdefault("buffer_time_after", reservation_unit.buffer_time_after)

        reservation_unit.validators.validate_begin_before_end(begins_at, ends_at)
        reservation_unit.validators.validate_reservation_begin_time_staff(begin=begins_at)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begins_at=begins_at,
            ends_at=ends_at,
            new_buffer_time_before=buffer_time_before,
            new_buffer_time_after=buffer_time_after,
        )

        data["access_type"] = reservation_unit.actions.get_access_type_at(begins_at, default=AccessType.UNRESTRICTED)

        return data

    def update(self, instance: ReservationSeries, validated_data: ReservationSeriesAddData) -> ReservationSeries:
        now = local_datetime()

        # Copy last reservation in the series to use as the new reservation
        # (not first since past reservations could have outdated data if series has been updated).
        #
        # This retains data from many-to-one relationships, but not for many-to-many or one-to-many relationships.
        # One-to-one relationships to or from the model would cause an error.
        reservation: Reservation = instance.reservations.last()

        # A little trick for making a copy of an existing instance
        # See: https://docs.djangoproject.com/en/dev/topics/db/queries/#copying-model-instances
        reservation._state.adding = True  # noqa: SLF001
        reservation.id = None

        reservation.begins_at = validated_data["begins_at"]
        reservation.ends_at = validated_data["begins_at"]
        reservation.buffer_time_before = validated_data["buffer_time_before"]
        reservation.buffer_time_after = validated_data["buffer_time_after"]
        reservation.access_type = validated_data["access_type"]
        # Will be updated by rescheduling below if has access code.
        reservation.access_code_is_active = False
        reservation.access_code_generated_at = None

        reservation.ext_uuid = uuid.uuid4()
        reservation.state = ReservationStateChoice.CONFIRMED
        reservation.created_at = now
        reservation.handled_at = now
        reservation.confirmed_at = now
        reservation.handling_details = ""
        reservation.cancel_details = ""

        reservation.save()

        # Reschedule Pindora series or seasonal booking if new reservation uses access code
        if validated_data["access_type"] == AccessType.ACCESS_CODE:
            # Allow mutation to succeed if Pindora request fails.
            try:
                try:
                    PindoraService.reschedule_access_code(instance)
                except PindoraNotFoundError:
                    PindoraService.create_access_code(instance, is_active=True)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation series: {instance.pk}")

        return instance
