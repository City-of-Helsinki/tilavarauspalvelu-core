from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.conf import settings
from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import (
    MunicipalityChoice,
    ReservationStartInterval,
    ReservationStateChoice,
    ReservationTypeStaffChoice,
    Weekday,
)
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationSeries
from tilavarauspalvelu.tasks import create_statistics_for_reservations_task, update_affecting_time_spans_task
from utils.external_service.errors import ExternalServiceError
from utils.fields.serializer import CurrentUserDefaultNullable, input_only_field

if TYPE_CHECKING:
    import datetime

    from tilavarauspalvelu.models import ReservationUnit
    from tilavarauspalvelu.typing import ReservationDetails, ReservationSeriesCreateData

__all__ = [
    "ReservationSeriesCreateSerializer",
]


class ReservationSeriesReservationCreateSerializer(NestingModelSerializer):
    type = EnumFriendlyChoiceField(
        choices=ReservationTypeStaffChoice.choices,
        enum=ReservationTypeStaffChoice,
        required=True,
    )

    state = EnumFriendlyChoiceField(
        choices=ReservationStateChoice.choices,
        enum=ReservationStateChoice,
        required=False,
    )

    municipality = EnumFriendlyChoiceField(
        choices=MunicipalityChoice.choices,
        enum=MunicipalityChoice,
        allow_null=True,
        default=None,
        required=False,
    )

    class Meta:
        model = Reservation
        fields = [
            #
            "name",
            "description",
            "num_persons",
            "state",
            "type",
            "working_memo",
            #
            "buffer_time_before",
            "buffer_time_after",
            "handled_at",
            "confirmed_at",
            #
            "applying_for_free_of_charge",
            "free_of_charge_reason",
            #
            "reservee_identifier",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_type",
            #
            "user",
            "purpose",
            "municipality",
            "age_group",
        ]
        extra_kwargs = {field: {"required": field in {"type", "user"}} for field in fields}


class ReservationSeriesCreateSerializer(NestingModelSerializer):
    """Create the reservation series with all its reservations."""

    instance: None

    weekdays = serializers.ListField(
        child=EnumFriendlyChoiceField(choices=Weekday.choices, enum=Weekday, required=False),
        allow_empty=False,
        required=True,
    )
    user = serializers.HiddenField(default=CurrentUserDefaultNullable())

    reservation_details = ReservationSeriesReservationCreateSerializer(
        required=True,
        write_only=True,
        validators=[input_only_field],
    )
    check_opening_hours = serializers.BooleanField(
        required=False,
        write_only=True,
        validators=[input_only_field],
    )
    skip_dates = serializers.ListField(
        child=serializers.DateField(),
        required=False,
        allow_empty=True,
        write_only=True,
        validators=[input_only_field],
    )

    class Meta:
        model = ReservationSeries
        fields = [
            "pk",
            "user",
            "name",
            "description",
            "reservation_unit",
            "age_group",
            "recurrence_in_days",
            "weekdays",
            "begin_time",
            "end_time",
            "begin_date",
            "end_date",
            "reservation_details",
            "check_opening_hours",
            "skip_dates",
        ]
        extra_kwargs = {
            "begin_date": {"required": True},
            "end_date": {"required": True},
            "begin_time": {"required": True},
            "end_time": {"required": True},
            "recurrence_in_days": {"required": True},
        }

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        begin_date: datetime.date = self.get_or_default("begin_date", data)
        begin_time: datetime.time = self.get_or_default("begin_time", data)
        end_date: datetime.date = self.get_or_default("end_date", data)
        end_time: datetime.time = self.get_or_default("end_time", data)
        reservation_unit: ReservationUnit = self.get_or_default("reservation_unit", data)
        interval = ReservationStartInterval(reservation_unit.reservation_start_interval)

        ReservationSeries.validators.validate_series_time_slots(
            begin_date=begin_date,
            begin_time=begin_time,
            end_date=end_date,
            end_time=end_time,
            reservation_start_interval=interval,
        )

        return data

    def validate_recurrence_in_days(self, recurrence_in_days: int) -> int:
        if recurrence_in_days == 0 or recurrence_in_days % 7 != 0:
            msg = "Reoccurrence interval must be a multiple of 7 days."
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_INVALID_RECURRENCE_IN_DAYS)

        return recurrence_in_days

    def create(self, validated_data: ReservationSeriesCreateData) -> ReservationSeries:
        reservation_details: ReservationDetails = self.initial_data.get("reservation_details", {})
        skip_dates = self.initial_data.get("skip_dates", [])
        check_opening_hours = self.initial_data.get("check_opening_hours", False)

        # Create both the reservation series and the reservations in a transaction.
        # This way if we get, e.g., overlapping reservations, the whole operation is rolled back.
        with transaction.atomic():
            instance: ReservationSeries = super().create(validated_data)
            reservations = self.create_reservations(
                instance=instance,
                reservation_details=reservation_details,
                skip_dates=skip_dates,
                check_opening_hours=check_opening_hours,
            )

        # Create any access codes if any reservations require them.
        if instance.reservations.requires_active_access_code().exists():
            # Allow mutation to succeed if Pindora request fails.
            try:
                PindoraService.create_access_code(instance, is_active=True)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation series: {instance.pk}")

        # Must refresh the materialized view since new reservations are created.
        if settings.UPDATE_AFFECTING_TIME_SPANS:
            update_affecting_time_spans_task.delay()

        if settings.SAVE_RESERVATION_STATISTICS:
            create_statistics_for_reservations_task.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        return instance

    def create_reservations(
        self,
        *,
        instance: ReservationSeries,
        reservation_details: ReservationDetails,
        skip_dates: list[datetime.date],
        check_opening_hours: bool,
    ) -> list[Reservation]:
        slots = instance.actions.pre_calculate_slots(
            check_opening_hours=check_opening_hours,
            check_buffers=True,
            buffer_time_before=reservation_details.get("buffer_time_before"),
            buffer_time_after=reservation_details.get("buffer_time_after"),
            skip_dates=skip_dates,
        )

        if slots.overlapping:
            msg = "Not all reservations can be made due to overlapping reservations."
            extensions = {
                "code": error_codes.RESERVATION_SERIES_OVERLAPS,
                "overlapping": slots.overlapping_json,
            }
            raise GraphQLError(msg, extensions=extensions)

        if slots.not_reservable:
            msg = "Not all reservations can be made due to falling outside reservable times."
            extensions = {
                "code": error_codes.RESERVATION_SERIES_NOT_OPEN,
                "not_reservable": slots.not_reservable_json,
            }
            raise GraphQLError(msg, extensions=extensions)

        if slots.invalid_start_interval:
            msg = "Not all reservations can be made due to invalid start intervals."
            extensions = {
                "code": error_codes.RESERVATION_SERIES_INVALID_START_INTERVAL,
                "invalid_start_interval": slots.invalid_start_interval_json,
            }
            raise GraphQLError(msg, extensions=extensions)

        return instance.actions.bulk_create_reservation_for_periods(slots.non_overlapping, reservation_details)
