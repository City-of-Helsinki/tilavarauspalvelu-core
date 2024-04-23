import datetime
from typing import Any, TypedDict

from graphene_django_extensions import NestingModelSerializer
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.graphql.extensions import error_codes
from common.date_utils import DEFAULT_TIMEZONE
from common.fields.serializer import CurrentUserDefaultNullable
from reservation_units.enums import ReservationStartInterval
from reservation_units.models import ReservationUnit
from reservations.models import RecurringReservation

__all__ = [
    "RecurringReservationCreateSerializer",
]


class ReservationPeriod(TypedDict):
    begin: datetime.datetime
    end: datetime.datetime


class ReservationPeriodJSON(TypedDict):
    begin: str  # iso-format str
    end: str  # iso-format str


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

        if end_time < begin_time:
            msg = "Begin time cannot be after end time."
            raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_TIME_AFTER_END_TIME)

        self.validate_start_interval(reservation_unit, begin_time)

        return data

    def validate_weekdays(self, weekdays: list[int]) -> str:
        for weekday in weekdays:
            if weekday not in range(6):
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
        interval_minutes = ReservationStartInterval(reservation_unit.reservation_start_interval).as_number

        # Staff reservations ignore start intervals longer than 30 minutes
        if interval_minutes != 15:
            interval_minutes = 30

        # For staff reservations, we don't need to care about opening hours,
        # so we can just check start interval from the beginning of the day.
        for hour in range(24):
            for minute in range(0, 60, interval_minutes):
                start_time = datetime.time(hour=hour, minute=minute, tzinfo=DEFAULT_TIMEZONE)
                if start_time == begin_time:
                    return

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
