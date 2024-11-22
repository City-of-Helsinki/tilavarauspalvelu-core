from __future__ import annotations

import datetime
from typing import Any

from django.conf import settings
from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphene_django_extensions.fields import EnumFriendlyChoiceField
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import (
    ReservationStartInterval,
    ReservationStateChoice,
    ReservationTypeStaffChoice,
    WeekdayChoice,
)
from tilavarauspalvelu.models import (
    RecurringReservation,
    Reservation,
    ReservationDenyReason,
    ReservationStatistic,
    ReservationUnit,
)
from tilavarauspalvelu.models.recurring_reservation.actions import ReservationDetails
from tilavarauspalvelu.tasks import create_or_update_reservation_statistics, update_affecting_time_spans_task
from tilavarauspalvelu.utils.opening_hours.reservable_time_span_client import ReservableTimeSpanClient
from utils.date_utils import DEFAULT_TIMEZONE, combine, local_date, local_datetime
from utils.fields.serializer import CurrentUserDefaultNullable, input_only_field

__all__ = [
    "ReservationSeriesCreateSerializer",
    "ReservationSeriesRescheduleSerializer",
    "ReservationSeriesUpdateSerializer",
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
            "age_group",
        ]
        extra_kwargs = {field: {"required": field in {"type", "user"}} for field in fields}


class ReservationSeriesCreateSerializer(NestingModelSerializer):
    """Create the recurring reservation with all its reservations."""

    instance: None

    weekdays = serializers.ListField(child=serializers.IntegerField(), allow_empty=False, required=True)
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

        validate_series_time_slots(
            begin_date=begin_date,
            begin_time=begin_time,
            end_date=end_date,
            end_time=end_time,
            reservation_start_interval=interval,
        )

        return data

    def validate_weekdays(self, weekdays: list[int]) -> str:
        weekdays = list(set(weekdays))
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

    def save(self, **kwargs: Any) -> RecurringReservation:
        reservation_details: ReservationDetails = self.initial_data.get("reservation_details", {})
        skip_dates = self.initial_data.get("skip_dates", [])
        check_opening_hours = self.initial_data.get("check_opening_hours", False)

        # Create both the recurring reservation and the reservations in a transaction.
        # This way if we get, e.g., overlapping reservations, the whole operation is rolled back.
        with transaction.atomic():
            instance = super().save()
            reservations = self.create_reservations(
                instance=instance,
                reservation_details=reservation_details,
                skip_dates=skip_dates,
                check_opening_hours=check_opening_hours,
            )

        # Must refresh the materialized view since new reservations are created.
        if settings.UPDATE_AFFECTING_TIME_SPANS:
            update_affecting_time_spans_task.delay()

        if settings.SAVE_RESERVATION_STATISTICS:
            create_or_update_reservation_statistics.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        return instance

    def create_reservations(
        self,
        *,
        instance: RecurringReservation,
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


class ReservationSeriesReservationUpdateSerializer(NestingModelSerializer):
    class Meta:
        model = Reservation
        fields = [
            "name",
            "description",
            "num_persons",
            "working_memo",
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
            "purpose",
            "home_city",
            "age_group",
        ]
        extra_kwargs = {field: {"required": False} for field in fields}


class ReservationSeriesUpdateSerializer(NestingModelSerializer):
    """Update recurring reservation and its reservation data."""

    instance: RecurringReservation

    reservation_details = ReservationSeriesReservationUpdateSerializer(
        required=False,
        write_only=True,
        validators=[input_only_field],
    )
    skip_reservations = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        allow_empty=True,
        write_only=True,
        validators=[input_only_field],
    )

    class Meta:
        model = RecurringReservation
        fields = [
            "pk",
            "name",
            "description",
            "age_group",
            "reservation_details",
            "skip_reservations",
        ]
        extra_kwargs = {
            "name": {"required": False},
            "description": {"required": False},
            "age_group": {"required": False},
        }

    def save(self, **kwargs: Any) -> RecurringReservation:
        reservation_details: ReservationDetails = self.initial_data.get("reservation_details", {})
        skip_reservations = self.initial_data.get("skip_reservations", [])

        age_group: int | None = self.validated_data.get("age_group")
        if age_group is not None:
            reservation_details.setdefault("age_group", age_group)

        description: str | None = self.validated_data.get("description")
        if description is not None:
            reservation_details.setdefault("working_memo", description)

        reservations = Reservation.objects.filter(recurring_reservation=self.instance).exclude(pk__in=skip_reservations)

        with transaction.atomic():
            instance = super().save()
            reservations.update(**reservation_details)

        if settings.SAVE_RESERVATION_STATISTICS:
            create_or_update_reservation_statistics.delay(
                reservation_pks=list(reservations.values_list("pk", flat=True)),
            )

        return instance


class ReservationSeriesRescheduleSerializer(NestingModelSerializer):
    """Reschedule recurring reservation."""

    instance: RecurringReservation

    weekdays = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False,
        required=False,
    )
    buffer_time_before = serializers.DurationField(
        required=False,
        write_only=True,
        validators=[input_only_field],
    )
    buffer_time_after = serializers.DurationField(
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
        model = RecurringReservation
        fields = [
            "pk",
            "begin_date",
            "begin_time",
            "end_date",
            "end_time",
            "weekdays",
            "skip_dates",
            "buffer_time_before",
            "buffer_time_after",
        ]
        extra_kwargs = {
            "begin_date": {"required": False},
            "begin_time": {"required": False},
            "end_date": {"required": False},
            "end_time": {"required": False},
        }

    def validate_weekdays(self, weekdays: list[int]) -> str:
        weekdays = list(set(weekdays))
        for weekday in weekdays:
            if weekday not in WeekdayChoice.values:
                msg = f"Invalid weekday: {weekday}."
                raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_INVALID_WEEKDAY)

        return ",".join(str(day) for day in weekdays)

    def validate(self, data: dict[str, Any]) -> dict[str, Any]:
        begin_date: datetime.date = self.get_or_default("begin_date", data)
        begin_time: datetime.time = self.get_or_default("begin_time", data)
        end_date: datetime.date = self.get_or_default("end_date", data)
        end_time: datetime.time = self.get_or_default("end_time", data)
        interval = ReservationStartInterval(self.instance.reservation_unit.reservation_start_interval)

        if not self.instance.reservations.exists():
            msg = "Reservation series must have at least one reservation to reschedule"
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_NO_RESERVATIONS)

        now = local_datetime()
        first_reservation = self.instance.reservations.order_by("begin").first()
        if begin_date != self.instance.begin_date and first_reservation.begin < now:
            msg = (
                "Reservation series' begin date cannot be changed after its "
                "first reservation's start time is in the past."
            )
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_ALREADY_STARTED)

        validate_series_time_slots(
            begin_date=begin_date,
            begin_time=begin_time,
            end_date=end_date,
            end_time=end_time,
            reservation_start_interval=interval,
        )
        return data

    def save(self, **kwargs: Any) -> RecurringReservation:
        skip_dates: list[datetime.date] = self.initial_data.get("skip_dates", [])
        buffer_time_before: datetime.timedelta | None = self.initial_data.get("buffer_time_before")
        buffer_time_after: datetime.timedelta | None = self.initial_data.get("buffer_time_after")

        # Create both the recurring reservation and the reservations in a transaction.
        # This way if we get, e.g., overlapping reservations, the whole operation is rolled back.
        with transaction.atomic():
            instance = super().save()
            reservations = self.recreate_reservations(
                instance,
                buffer_time_before=buffer_time_before,
                buffer_time_after=buffer_time_after,
                skip_dates=skip_dates,
            )

        # Must refresh the materialized view since reservations changed time.
        if settings.UPDATE_AFFECTING_TIME_SPANS:
            update_affecting_time_spans_task.delay()

        if settings.SAVE_RESERVATION_STATISTICS:
            create_or_update_reservation_statistics.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        return instance

    def recreate_reservations(
        self,
        instance: RecurringReservation,
        buffer_time_before: datetime.timedelta | None,
        buffer_time_after: datetime.timedelta | None,
        skip_dates: list[datetime.date],
    ) -> list[Reservation]:
        now = local_datetime()
        today = now.date()

        # New reservations can overlap with existing reservations in this series
        old_reservation_ids: list[int] = list(instance.reservations.values_list("pk", flat=True))

        # Skip generating reservations for any dates where there is currently a non-confirmed reservation.
        # It's unlikely that the reserver will want or can have the same date even if the time is changed.
        # Any exceptions can be handled after the fact.
        skip_dates += list(
            instance.reservations.exclude(
                state=ReservationStateChoice.CONFIRMED,
            ).values_list("begin__date", flat=True)
        )

        reservation_details = self.get_reservation_details(instance)
        reservation_details["buffer_time_before"] = buffer_time_before or datetime.timedelta()
        reservation_details["buffer_time_after"] = buffer_time_after or datetime.timedelta()

        # Only recreate reservations from this moment onwards
        if instance.begin_date < today:
            skip_dates += [
                instance.begin_date + datetime.timedelta(days=delta)  #
                for delta in range((today - instance.begin_date).days)
            ]
            if combine(today, instance.begin_time, tzinfo=DEFAULT_TIMEZONE) < now:
                skip_dates.append(today)

        slots = instance.actions.pre_calculate_slots(
            check_buffers=True,
            buffer_time_before=buffer_time_before,
            buffer_time_after=buffer_time_after,
            skip_dates=skip_dates,
            ignore_reservations=old_reservation_ids,
        )

        if slots.overlapping:
            msg = "Not all reservations can be made due to overlapping reservations."
            extensions = {
                "code": error_codes.RESERVATION_SERIES_OVERLAPS,
                "overlapping": slots.overlapping_json,
            }
            raise GraphQLError(msg, extensions=extensions)

        # Remove CONFIRMED reservations that have not yet begun.
        # Also remove any statistics for these reservations, since they are being replaced by the new ones.
        old_reservations = instance.reservations.filter(begin__gt=now, state=ReservationStateChoice.CONFIRMED)
        ReservationStatistic.objects.filter(reservation__in=old_reservations).delete()
        old_reservations.delete()

        return instance.actions.bulk_create_reservation_for_periods(slots.non_overlapping, reservation_details)

    def get_reservation_details(self, instance: RecurringReservation) -> ReservationDetails:
        """
        Use reservation details from the next reservation relative to the current time that is going to occur.
        If there is no next reservation, use the previous reservation.
        If there are not reservations this way, check cancelled and denied reservations as well.

        We validated previously that there is at least one reservation in the series,
        so we can safely assume that we will have at least one reservation to get details from.
        """
        now = local_datetime()

        next_reservation = instance.reservations.filter(begin__gte=now).going_to_occur().order_by("begin").first()
        if next_reservation is None:
            next_reservation = instance.reservations.filter(begin__lt=now).going_to_occur().order_by("-begin").first()
        if next_reservation is None:
            next_reservation = instance.reservations.filter(begin__gte=now).order_by("begin").first()
        if next_reservation is None:
            next_reservation = instance.reservations.filter(begin__lt=now).order_by("-begin").first()

        return ReservationDetails(
            name=next_reservation.name,
            description=next_reservation.description,
            num_persons=next_reservation.num_persons,
            # Regardless of the user's reservation state, we always create new CONFIRMED reservations.
            state=ReservationStateChoice.CONFIRMED,
            type=next_reservation.type,
            working_memo=next_reservation.working_memo,
            #
            handled_at=now,
            confirmed_at=now,
            #
            applying_for_free_of_charge=next_reservation.applying_for_free_of_charge,
            free_of_charge_reason=next_reservation.free_of_charge_reason,
            #
            reservee_id=next_reservation.reservee_id,
            reservee_first_name=next_reservation.reservee_first_name,
            reservee_last_name=next_reservation.reservee_last_name,
            reservee_email=next_reservation.reservee_email,
            reservee_phone=next_reservation.reservee_phone,
            reservee_organisation_name=next_reservation.reservee_organisation_name,
            reservee_address_street=next_reservation.reservee_address_street,
            reservee_address_city=next_reservation.reservee_address_city,
            reservee_address_zip=next_reservation.reservee_address_zip,
            reservee_is_unregistered_association=next_reservation.reservee_is_unregistered_association,
            reservee_language=next_reservation.reservee_language,
            reservee_type=next_reservation.reservee_type,
            #
            billing_first_name=next_reservation.billing_first_name,
            billing_last_name=next_reservation.billing_last_name,
            billing_email=next_reservation.billing_email,
            billing_phone=next_reservation.billing_phone,
            billing_address_street=next_reservation.billing_address_street,
            billing_address_city=next_reservation.billing_address_city,
            billing_address_zip=next_reservation.billing_address_zip,
            #
            user=next_reservation.user,
            purpose=next_reservation.purpose,
            home_city=next_reservation.home_city,
        )


def validate_series_time_slots(
    begin_date: datetime.date,
    begin_time: datetime.time,
    end_date: datetime.date,
    end_time: datetime.time,
    reservation_start_interval: ReservationStartInterval,
) -> None:
    if end_date < begin_date:
        msg = "Begin date cannot be after end date."
        raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_DATE_AFTER_END_DATE)

    if end_date > local_date() + datetime.timedelta(days=ReservableTimeSpanClient.DAYS_TO_FETCH):
        msg = "Cannot create reservations for more than 2 years in the future."
        raise ValidationError(msg, code=error_codes.RESERVATION_END_DATE_TOO_FAR)

    if begin_date == end_date and end_time <= begin_time:
        msg = "Begin time cannot be after end time if on the same day."
        raise ValidationError(msg, code=error_codes.RESERVATION_BEGIN_TIME_AFTER_END_TIME)

    # Staff reservations ignore start intervals longer than 30 minutes
    interval_minutes = min(reservation_start_interval.as_number, 30)

    # For staff reservations, we don't need to care about opening hours,
    # so we can just check start interval from the beginning of the day.
    is_valid_start_interval = (
        begin_time.second == 0  #
        and begin_time.microsecond == 0
        and begin_time.minute % interval_minutes == 0
    )

    if not is_valid_start_interval:
        msg = f"Reservation start time does not match the allowed interval of {interval_minutes} minutes."
        raise ValidationError(msg, code=error_codes.RESERVATION_TIME_DOES_NOT_MATCH_ALLOWED_INTERVAL)


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

    def save(self, **kwargs: Any) -> RecurringReservation:
        now = local_datetime()

        reservations = self.instance.reservations.filter(
            begin__gt=now,
            state__in=ReservationStateChoice.states_that_can_change_to_deny,
        )

        reservations.update(
            state=ReservationStateChoice.DENIED,
            deny_reason=self.validated_data["deny_reason"],
            handling_details=self.validated_data.get("handling_details", ""),
            handled_at=now,
        )

        # Must refresh the materialized view since reservations state changed to 'DENIED'
        if settings.UPDATE_AFFECTING_TIME_SPANS:
            update_affecting_time_spans_task.delay()

        if settings.SAVE_RESERVATION_STATISTICS:
            create_or_update_reservation_statistics.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        return self.instance


class ReservationSeriesDenyOutputSerializer(NestingModelSerializer):
    denied = serializers.IntegerField(required=True)
    future = serializers.IntegerField(required=True)

    class Meta:
        model = RecurringReservation
        fields = [
            "denied",
            "future",
        ]
