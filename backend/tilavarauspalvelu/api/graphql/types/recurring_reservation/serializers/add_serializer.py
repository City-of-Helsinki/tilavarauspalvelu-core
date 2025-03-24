from __future__ import annotations

import datetime
import uuid
from typing import TYPE_CHECKING

from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import RecurringReservation
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceError

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.typing import ReservationSeriesAddData


__all__ = [
    "ReservationSeriesAddReservationSerializer",
]


class ReservationSeriesAddReservationSerializer(NestingModelSerializer):
    """Add a reservation to a recurring reservation."""

    instance: RecurringReservation

    pk = serializers.IntegerField(required=True)

    begin = serializers.DateTimeField(required=True, write_only=True)
    end = serializers.DateTimeField(required=True, write_only=True)

    buffer_time_before = serializers.DurationField(required=False, write_only=True)
    buffer_time_after = serializers.DurationField(required=False, write_only=True)

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "begin",
            "end",
            "buffer_time_before",
            "buffer_time_after",
        ]

    def validate(self, data: ReservationSeriesAddData) -> ReservationSeriesAddData:
        self.instance.validators.validate_has_reservations()

        reservation_unit = self.instance.reservation_unit
        first_reservation: Reservation = self.instance.reservations.first()
        reservation_type = first_reservation.type

        begin: datetime.datetime = data["begin"].astimezone(DEFAULT_TIMEZONE)
        end: datetime.datetime = data["end"].astimezone(DEFAULT_TIMEZONE)

        if reservation_unit.reservation_block_whole_day:
            data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begin)
            data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(end)

        # Buffers should not be used for blocking reservations
        elif reservation_type == ReservationTypeChoice.BLOCKED:
            data["buffer_time_before"] = datetime.timedelta()
            data["buffer_time_after"] = datetime.timedelta()

        buffer_time_before = data.setdefault("buffer_time_before", reservation_unit.buffer_time_before)
        buffer_time_after = data.setdefault("buffer_time_after", reservation_unit.buffer_time_after)

        reservation_unit.validators.validate_begin_before_end(begin, end)
        reservation_unit.validators.validate_reservation_begin_time_staff(begin=begin)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begin=begin,
            end=end,
            new_buffer_time_before=buffer_time_before,
            new_buffer_time_after=buffer_time_after,
        )

        data["access_type"] = reservation_unit.actions.get_access_type_at(begin, default=AccessType.UNRESTRICTED)

        return data

    def update(self, instance: RecurringReservation, validated_data: ReservationSeriesAddData) -> RecurringReservation:
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

        reservation.begin = validated_data["begin"]
        reservation.end = validated_data["end"]
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

        with transaction.atomic():
            reservation.save()
            reservation.reservation_units.set([instance.reservation_unit])

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
