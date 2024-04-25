import datetime
from collections.abc import Iterable
from typing import Any, TypedDict

from django.db import models, transaction
from graphene_django_extensions import NestingModelSerializer
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from api.graphql.extensions import error_codes
from common.date_utils import DEFAULT_TIMEZONE, combine, get_periods_between
from common.fields.serializer import CurrentUserDefaultNullable, input_only_field
from opening_hours.models import ReservableTimeSpan
from opening_hours.utils.time_span_element import TimeSpanElement
from reservation_units.enums import ReservationStartInterval
from reservation_units.models import ReservationUnit
from reservations.choices import ReservationTypeChoice
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

        if end_time <= begin_time:
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


# Reservation series


class ReservationPeriod(TypedDict):
    begin: datetime.datetime
    end: datetime.datetime


class ReservationPeriodJSON(TypedDict):
    begin: str  # iso-format str
    end: str  # iso-format str


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
            "unit_price",
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
        reservation_details: dict[str, Any] = self.initial_data.get("reservation_details")
        skip = self.initial_data.get("skip_dates", [])
        check_opening_hours = self.initial_data.get("check_opening_hours", False)

        # Create both the recurring reservation and the reservations in a transaction.
        # This way if we get, e.g., overlapping reservations, the whole operation is rolled back.
        with transaction.atomic():
            instance = super().save()
            self.create_reservations(instance, reservation_details, skip, check_opening_hours)

        return instance

    def create_reservations(
        self,
        instance: RecurringReservation,
        reservation_details: dict[str, Any],
        skip: list[datetime.date],
        check_opening_hours: bool,
    ) -> None:
        reserved_timespans = self.get_reserved_timespans(
            start_date=instance.begin_date,
            end_date=instance.end_date,
            reservation_unit=instance.reservation_unit,
        )

        reservable_timespans = self.get_reservable_timespans(instance) if check_opening_hours else []

        non_overlapping: list[ReservationPeriod] = []
        overlapping: list[ReservationPeriodJSON] = []
        not_reservable: list[ReservationPeriodJSON] = []

        begin_time: datetime.time = instance.begin_time  # type: ignore[assignment]
        end_time: datetime.time = instance.end_time  # type: ignore[assignment]

        weekdays: list[int] = [int(val) for val in instance.weekdays.split(",")]
        if not weekdays:
            weekdays = [instance.begin_date.weekday()]

        for weekday in weekdays:
            delta: int = weekday - instance.begin_date.weekday()
            if delta < 0:
                delta += 7

            begin_date: datetime.date = instance.begin_date + datetime.timedelta(days=delta)

            periods = get_periods_between(
                start_date=begin_date,
                end_date=instance.end_date,
                start_time=begin_time,
                end_time=end_time,
                interval=instance.recurrence_in_days,
                tzinfo=DEFAULT_TIMEZONE,
            )
            for begin, end in periods:
                if begin.date() in skip:
                    continue

                timespan = TimeSpanElement(
                    start_datetime=begin,
                    end_datetime=end,
                    is_reservable=True,
                    buffer_time_after=instance.reservation_unit.buffer_time_after,
                    buffer_time_before=instance.reservation_unit.buffer_time_before,
                )

                # Would the reservation overlap with any existing reservations?
                # Also checks that buffers for the reservation will also not overlap.
                if any(timespan.overlaps_with(reserved) for reserved in reserved_timespans):
                    overlapping.append(
                        ReservationPeriodJSON(
                            begin=begin.isoformat(timespec="seconds"),
                            end=end.isoformat(timespec="seconds"),
                        )
                    )
                    continue

                # Would the reservation be fully inside any reservable timespans for the resource?
                # Ignores buffers for the reservation, since those can be outside reservable times.
                if check_opening_hours and not any(
                    timespan.fully_inside_of(reservable) for reservable in reservable_timespans
                ):
                    not_reservable.append(
                        ReservationPeriodJSON(
                            begin=begin.isoformat(timespec="seconds"),
                            end=end.isoformat(timespec="seconds"),
                        )
                    )
                    continue

                non_overlapping.append(ReservationPeriod(begin=begin, end=end))

        if overlapping:
            msg = "Not all reservations can be made due to overlapping reservations."
            extensions = {"code": error_codes.RESERVATION_SERIES_OVERLAPS, "overlapping": overlapping}
            raise GraphQLError(msg, extensions=extensions)

        if not_reservable:
            msg = "Not all reservations can be made due to falling outside reservable times."
            extensions = {"code": error_codes.RESERVATION_SERIES_NOT_OPEN, "not_reservable": not_reservable}
            raise GraphQLError(msg, extensions=extensions)

        # Pick out the through model for the many-to-many relationship and use if for bulk creation
        ThroughModel: type[models.Model] = Reservation.reservation_unit.through  # noqa: N806

        reservations: list[Reservation] = []
        through_models: list[models.Model] = []

        for period in non_overlapping:
            reservation = Reservation(
                begin=period["begin"],
                end=period["end"],
                recurring_reservation=instance,
                age_group=instance.age_group,
                **reservation_details,
            )
            through = ThroughModel(
                reservation=reservation,
                reservationunit=instance.reservation_unit,
            )
            reservations.append(reservation)
            through_models.append(through)

        Reservation.objects.bulk_create(reservations)
        ThroughModel.objects.bulk_create(through_models)

    def get_reserved_timespans(
        self,
        start_date: datetime.date,
        end_date: datetime.date,
        reservation_unit: ReservationUnit,
    ) -> list[TimeSpanElement]:
        time_spans: list[TimeSpanElement] = []
        current_period: ReservationPeriod | None = None

        periods: Iterable[ReservationPeriod] = (
            Reservation.objects.overlapping_period(
                period_start=start_date,
                period_end=end_date,
            )
            .affecting_reservations(
                reservation_units=[reservation_unit.pk],
            )
            .values("begin", "end")
            .order_by("begin")
        )

        # Go through all affected reservations' periods and merge overlapping ones
        for period in periods:
            if current_period is None:
                current_period = period
                continue

            # If periods overlap or touch, merge them
            if period["begin"] <= current_period["end"]:
                current_period["end"] = period["end"]
                continue

            time_spans.append(
                TimeSpanElement(
                    start_datetime=current_period["begin"],
                    end_datetime=current_period["end"],
                    is_reservable=False,
                )
            )
            current_period = period

        # Add the remaining period after merging
        if current_period is not None:
            time_spans.append(
                TimeSpanElement(
                    start_datetime=current_period["begin"],
                    end_datetime=current_period["end"],
                    is_reservable=False,
                )
            )

        return time_spans

    def get_reservable_timespans(self, instance: RecurringReservation) -> list[TimeSpanElement]:
        begin_time: datetime.time = instance.begin_time  # type: ignore[assignment]
        end_time: datetime.time = instance.end_time  # type: ignore[assignment]
        resource = instance.reservation_unit.origin_hauki_resource
        if resource is None:
            return []

        timespans: Iterable[ReservableTimeSpan] = resource.reservable_time_spans.all().overlapping_with_period(
            start=combine(instance.begin_date, begin_time, tzinfo=DEFAULT_TIMEZONE),
            end=combine(instance.end_date, end_time, tzinfo=DEFAULT_TIMEZONE),
        )

        return [timespan.as_time_span_element() for timespan in timespans]
