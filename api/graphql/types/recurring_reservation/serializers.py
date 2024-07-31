import datetime
from typing import Any

from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from actions.recurring_reservation import ReservationDetails
from api.graphql.extensions import error_codes
from applications.enums import WeekdayChoice
from common.date_utils import local_date
from common.fields.serializer import CurrentUserDefaultNullable, input_only_field
from opening_hours.utils.reservable_time_span_client import ReservableTimeSpanClient
from reservation_units.enums import ReservationStartInterval
from reservation_units.models import ReservationUnit
from reservations.enums import ReservationTypeChoice
from reservations.models import RecurringReservation, Reservation

__all__ = [
    "RecurringReservationCreateSerializer",
]


class RecurringReservationCreateSerializer(NestingModelSerializer):
    instance: None

    weekdays = serializers.ListField(child=serializers.IntegerField(), allow_empty=False, required=True)
    user = serializers.HiddenField(default=CurrentUserDefaultNullable())

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "user",
            "name",
            "description",
            "reservation_unit",
            "age_group",
            "ability_group",
            "recurrence_in_days",
            "weekdays",
            "begin_time",
            "end_time",
            "begin_date",
            "end_date",
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
        end_date: datetime.date = self.get_or_default("end_date", data)
        begin_time: datetime.time = self.get_or_default("begin_time", data)
        end_time: datetime.time = self.get_or_default("end_time", data)
        reservation_unit: ReservationUnit = self.get_or_default("reservation_unit", data)

        if end_date < begin_date:
            msg = "Begin date cannot be after end date."
            raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_DATE_AFTER_END_DATE)

        if end_date > local_date() + datetime.timedelta(days=ReservableTimeSpanClient.DAYS_TO_FETCH):
            msg = "Cannot create recurring reservation for more than 2 years in the future."
            raise ValidationError(msg, code=error_codes.RESERVATION_END_DATE_TOO_FAR)

        if begin_date == end_date and end_time <= begin_time:
            msg = "Begin time cannot be after end time if on the same day."
            raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_TIME_AFTER_END_TIME)

        self.validate_start_interval(reservation_unit, begin_time)

        return data

    def validate_weekdays(self, weekdays: list[int]) -> str:
        for weekday in weekdays:
            if weekday not in WeekdayChoice.values:
                msg = f"Invalid weekday: {weekday}."
                raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_INVALID_WEEKDAY)

        return ",".join(str(day) for day in weekdays)

    def validate_recurrence_in_days(self, recurrence_in_days: int) -> int:
        if recurrence_in_days == 0 or recurrence_in_days % 7 != 0:
            msg = "Reoccurrence interval must be a multiple of 7 days."
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_INVALID_RECURRENCE_IN_DAYS)

        return recurrence_in_days

    @staticmethod
    def validate_start_interval(reservation_unit: ReservationUnit, begin_time: datetime.time) -> None:
        is_valid = reservation_unit.actions.is_valid_staff_start_interval(begin_time)
        if not is_valid:
            interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number
            msg = f"Reservation start time does not match the allowed interval of {interval_minutes} minutes."
            raise ValidationError(msg, code=error_codes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL)


class RecurringReservationUpdateSerializer(RecurringReservationCreateSerializer):
    instance: RecurringReservation

    weekdays = serializers.ListField(child=serializers.IntegerField(), allow_empty=False, required=False)

    class Meta(RecurringReservationCreateSerializer.Meta):
        extra_kwargs = {
            "begin_date": {"required": False},
            "end_date": {"required": False},
            "begin_time": {"required": False},
            "end_time": {"required": False},
            "reservation_unit": {"read_only": False},
            "recurrence_in_days": {"required": False},
        }


# Reservation series


class ReservationSeriesReservationSerializer(NestingModelSerializer):
    type = serializers.ChoiceField(choices=ReservationTypeChoice.allowed_for_staff_create, required=True)

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
            "reservee_id",
            "reservee_first_name",
            "reservee_last_name",
            "reservee_email",
            "reservee_phone",
            "reservee_organisation_name",
            "reservee_address_street",
            "reservee_address_city",
            "reservee_address_zip",
            "reservee_is_unregistered_association",
            "reservee_language",
            "reservee_type",
            #
            "billing_first_name",
            "billing_last_name",
            "billing_email",
            "billing_phone",
            "billing_address_street",
            "billing_address_city",
            "billing_address_zip",
            #
            "user",
            "purpose",
            "home_city",
        ]
        extra_kwargs = {field: {"required": field in ["type", "user"]} for field in fields}


class ReservationSeriesSerializer(RecurringReservationCreateSerializer):
    """Create the recurring reservation with all its reservations."""

    reservation_details = ReservationSeriesReservationSerializer(
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

    class Meta(RecurringReservationCreateSerializer.Meta):
        fields = [
            *RecurringReservationCreateSerializer.Meta.fields,
            "reservation_details",
            "check_opening_hours",
            "skip_dates",
        ]

    def save(self, **kwargs: Any) -> RecurringReservation:
        reservation_details: ReservationDetails = self.initial_data.get("reservation_details")
        skip_dates = self.initial_data.get("skip_dates", [])
        check_opening_hours = self.initial_data.get("check_opening_hours", False)

        # Create both the recurring reservation and the reservations in a transaction.
        # This way if we get, e.g., overlapping reservations, the whole operation is rolled back.
        with transaction.atomic():
            instance = super().save()
            self.create_reservations(instance, reservation_details, skip_dates, check_opening_hours)

        return instance

    def create_reservations(
        self,
        instance: RecurringReservation,
        reservation_details: ReservationDetails,
        skip_dates: list[datetime.date],
        check_opening_hours: bool,
    ) -> None:
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

        instance.actions.bulk_create_reservation_for_periods(slots.non_overlapping, reservation_details)
