from __future__ import annotations

import datetime
from typing import TYPE_CHECKING

from django.conf import settings
from django.db import transaction
from graphene_django_extensions import NestingModelSerializer
from graphql import GraphQLError
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.extensions import error_codes
from tilavarauspalvelu.enums import ReservationStartInterval, ReservationStateChoice, WeekdayChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.models import RecurringReservation, ReservationStatistic
from tilavarauspalvelu.models.recurring_reservation.actions import ReservationDetails
from tilavarauspalvelu.tasks import create_or_update_reservation_statistics, update_affecting_time_spans_task
from utils.date_utils import DEFAULT_TIMEZONE, combine, local_datetime
from utils.fields.serializer import input_only_field

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Reservation
    from tilavarauspalvelu.typing import ReservationSeriesRescheduleData


__all__ = [
    "ReservationSeriesRescheduleSerializer",
]


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

    def validate(self, data: ReservationSeriesRescheduleData) -> ReservationSeriesRescheduleData:
        begin_date: datetime.date = self.get_or_default("begin_date", data)
        begin_time: datetime.time = self.get_or_default("begin_time", data)
        end_date: datetime.date = self.get_or_default("end_date", data)
        end_time: datetime.time = self.get_or_default("end_time", data)
        interval = ReservationStartInterval(self.instance.reservation_unit.reservation_start_interval)

        now = local_datetime()

        if not self.instance.reservations.future().exists():
            msg = "Reservation series must have at least one future reservation to reschedule"
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_NO_FUTURE_RESERVATIONS)

        # We know there is at least one future reservation, so we can safely assume
        # that we will have at least one reservation in the series
        first_reservation: Reservation = self.instance.reservations.order_by("begin").first()  # type: ignore[attr-defined]
        if begin_date != self.instance.begin_date and first_reservation.begin < now:
            msg = (
                "Reservation series' begin date cannot be changed after its "
                "first reservation's start time is in the past."
            )
            raise ValidationError(msg, code=error_codes.RESERVATION_SERIES_ALREADY_STARTED)

        RecurringReservation.validators.validate_series_time_slots(
            begin_date=begin_date,
            begin_time=begin_time,
            end_date=end_date,
            end_time=end_time,
            reservation_start_interval=interval,
        )
        return data

    def update(
        self,
        instance: RecurringReservation,
        validated_data: ReservationSeriesRescheduleData,
    ) -> RecurringReservation:
        skip_dates: set[datetime.date] = set(self.initial_data.get("skip_dates", []))
        buffer_time_before: datetime.timedelta | None = self.initial_data.get("buffer_time_before")
        buffer_time_after: datetime.timedelta | None = self.initial_data.get("buffer_time_after")

        had_access_codes = instance.reservations.requires_active_access_code().exists()

        # Create both the recurring reservation and the reservations in a transaction.
        # This way if we get, e.g., overlapping reservations, the whole operation is rolled back.
        with transaction.atomic():
            instance = super().update(instance, validated_data)
            reservations = self.recreate_reservations(
                instance,
                buffer_time_before=buffer_time_before,
                buffer_time_after=buffer_time_after,
                skip_dates=skip_dates,
            )

        has_access_codes = instance.reservations.requires_active_access_code().exists()

        # Must refresh the materialized view since reservations changed time.
        if settings.UPDATE_AFFECTING_TIME_SPANS:
            update_affecting_time_spans_task.delay()

        if settings.SAVE_RESERVATION_STATISTICS:
            create_or_update_reservation_statistics.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        EmailService.send_seasonal_reservation_modified_series_email(instance)

        if had_access_codes or has_access_codes:
            try:
                PindoraService.reschedule_access_code(instance)
            except PindoraNotFoundError:
                if has_access_codes:
                    PindoraService.create_access_code(instance, is_active=True)

        return instance

    def recreate_reservations(
        self,
        instance: RecurringReservation,
        buffer_time_before: datetime.timedelta | None,
        buffer_time_after: datetime.timedelta | None,
        skip_dates: set[datetime.date],
    ) -> list[Reservation]:
        now = local_datetime()
        today = now.date()

        # New reservations can overlap with existing reservations in this series,
        # since the existing ones will be deleted.
        old_reservation_ids: list[int] = list(instance.reservations.values_list("pk", flat=True))

        # Skip generating reservations for any dates where there is currently a non-confirmed reservation.
        # It's unlikely that the reserver will want or can have the same date even if the time is changed.
        # Any exceptions can be handled after the fact.
        skip_dates |= set(instance.reservations.unconfirmed().values_list("begin__date", flat=True))

        reservation_details = self.get_reservation_details(instance)
        reservation_details["buffer_time_before"] = buffer_time_before or datetime.timedelta()
        reservation_details["buffer_time_after"] = buffer_time_after or datetime.timedelta()

        # If the series has already started:
        if instance.begin_date <= today:
            # Only create reservation to the future.
            skip_dates |= {
                instance.begin_date + datetime.timedelta(days=delta)  #
                for delta in range((today - instance.begin_date).days)
            }

            # If new reservation would already have started, don't create it.
            if combine(today, instance.begin_time, tzinfo=DEFAULT_TIMEZONE) <= now:
                skip_dates.add(today)

            # If series already has a reservation that is ongoing or in the past, don't create new one for today.
            todays_reservation: Reservation | None = instance.reservations.filter(begin__date=today).first()
            if todays_reservation is not None and todays_reservation.begin.astimezone(DEFAULT_TIMEZONE) <= now:
                skip_dates.add(today)

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
        now = local_datetime()

        # Use reservation details from the next reservation relative to the current time that is going to occur.
        # We validated previously that there is at least one future reservation in the series,
        # so we can safely assume that we will have at least one reservation to get details from.
        next_reservation: Reservation = instance.reservations.future().order_by("begin").first()

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
