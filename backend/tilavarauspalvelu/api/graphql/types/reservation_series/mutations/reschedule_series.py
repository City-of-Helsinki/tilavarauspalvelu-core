import datetime

from django.conf import settings
from django.db import transaction
from graphql import GraphQLError
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation, ReservationSeries, ReservationStatistic, User
from tilavarauspalvelu.tasks import create_statistics_for_reservations_task
from tilavarauspalvelu.typing import ReservationDetails, ReservationSeriesRescheduleData, error_codes
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationSeriesRescheduleMutation",
]


class ReservationSeriesRescheduleMutation(MutationType[ReservationSeries], kind="update"):
    """Reschedule reservation series."""

    pk = Input(required=True)

    begin_date = Input(required=False)
    begin_time = Input(required=False)
    end_date = Input(required=False)
    end_time = Input(required=False)
    weekdays = Input(required=False)

    buffer_time_before = Input(datetime.timedelta, required=False, input_only=False)
    buffer_time_after = Input(datetime.timedelta, required=False, input_only=False)
    skip_dates = Input(list[datetime.date], default_value=[], input_only=False)

    @classmethod
    def __mutate__(
        cls,
        instance: ReservationSeries,
        info: GQLInfo[User],
        input_data: ReservationSeriesRescheduleData,
    ) -> ReservationSeries:
        reservation_unit = instance.reservation_unit

        user = info.context.user
        is_reservee = instance.user == user
        if not user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=is_reservee):
            msg = "No permission to access reservation series."
            raise GraphQLPermissionError(msg)

        # Use reservation details from the next reservation relative to the current time that is going to occur.
        # We validated previously that there is at least one future reservation in the series,
        # so we can safely assume that we will have at least one reservation to get details from.
        first_future_reservation = instance.reservations.all().future().order_by("begins_at").first()
        if first_future_reservation is None:
            msg = "Reservation series must have at least one future reservation to reschedule"
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_SERIES_NO_FUTURE_RESERVATIONS)

        first_reservation = instance.reservations.all().order_by("begins_at").first()

        begin_date = input_data.get("begin_date", instance.begin_date)
        begin_time = input_data.get("begin_time", instance.begin_time)
        end_date = input_data.get("end_date", instance.end_date)
        end_time = input_data.get("end_time", instance.end_time)
        interval = instance.reservation_unit.reservation_start_interval

        now = local_datetime()

        if begin_date != instance.begin_date and first_reservation.begins_at < now:
            msg = (
                "Reservation series' begin date cannot be changed after its "
                "first reservation's start time is in the past."
            )
            raise GraphQLValidationError(msg, code=error_codes.RESERVATION_SERIES_ALREADY_STARTED)

        ReservationSeries.validators.validate_series_time_slots(
            begin_date=begin_date,
            begin_time=begin_time,
            end_date=end_date,
            end_time=end_time,
            reservation_start_interval=interval,
        )

        buffer_time_before = input_data.pop("buffer_time_before", None)
        buffer_time_after = input_data.pop("buffer_time_after", None)
        skip_dates = input_data.pop("skip_dates", [])

        had_access_codes = instance.reservations.all().requires_active_access_code().exists()

        # Create both the reservation series and the reservations in a transaction.
        # This way if we get, e.g., overlapping reservations, the whole operation is rolled back.
        with transaction.atomic():
            for key, value in input_data.items():
                setattr(instance, key, value)
            instance.save()

            reservations = cls.recreate_reservations(
                instance=instance,
                reservation=first_future_reservation,
                buffer_time_before=buffer_time_before,
                buffer_time_after=buffer_time_after,
                skip_dates=set(skip_dates),
            )

            has_access_codes = instance.reservations.all().requires_active_access_code().exists()

            if had_access_codes or has_access_codes:
                try:
                    PindoraService.sync_access_code(obj=instance)
                except ExternalServiceError as error:
                    raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        # Must refresh the materialized view since reservations changed time.
        # TODO: Disabled for now, since it might contribute to timeouts in production.
        #  Refresh still happens on a background task every 2 minutes.
        #  if settings.UPDATE_AFFECTING_TIME_SPANS:  # noqa: ERA001,RUF100
        #      update_affecting_time_spans_task.delay()  # noqa: ERA001,RUF100

        if settings.SAVE_RESERVATION_STATISTICS:
            create_statistics_for_reservations_task.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        if instance.allocated_time_slot is not None:
            EmailService.send_seasonal_booking_rescheduled_series_email(instance)

        return instance

    @classmethod
    def recreate_reservations(
        cls,
        instance: ReservationSeries,
        reservation: Reservation,
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
        skip_dates |= set(instance.reservations.all().unconfirmed().values_list("begins_at__date", flat=True))

        reservation_details = ReservationDetails(
            name=reservation.name,
            description=reservation.description,
            num_persons=reservation.num_persons,
            # Regardless of the user's reservation state, we always create new CONFIRMED reservations.
            state=ReservationStateChoice.CONFIRMED,
            type=reservation.type,
            municipality=reservation.municipality,
            working_memo=reservation.working_memo,
            #
            buffer_time_before=buffer_time_before or datetime.timedelta(),
            buffer_time_after=buffer_time_after or datetime.timedelta(),
            handled_at=now,
            confirmed_at=now,
            #
            applying_for_free_of_charge=reservation.applying_for_free_of_charge,
            free_of_charge_reason=reservation.free_of_charge_reason,
            #
            reservee_identifier=reservation.reservee_identifier,
            reservee_first_name=reservation.reservee_first_name,
            reservee_last_name=reservation.reservee_last_name,
            reservee_email=reservation.reservee_email,
            reservee_phone=reservation.reservee_phone,
            reservee_organisation_name=reservation.reservee_organisation_name,
            reservee_address_street=reservation.reservee_address_street,
            reservee_address_city=reservation.reservee_address_city,
            reservee_address_zip=reservation.reservee_address_zip,
            reservee_type=reservation.reservee_type,
            #
            user=reservation.user,
            purpose=reservation.purpose,
        )

        # If the series has already started:
        if instance.begin_date <= today:
            # Only create reservation to the future.
            skip_dates |= {
                instance.begin_date + datetime.timedelta(days=delta)  #
                for delta in range((today - instance.begin_date).days)
            }

            # If new reservation would already have started, don't create it.
            if datetime.datetime.combine(today, instance.begin_time, tzinfo=DEFAULT_TIMEZONE) <= now:
                skip_dates.add(today)

            # If series already has a reservation that is ongoing or in the past, don't create new one for today.
            todays_reservation = instance.reservations.filter(begins_at__date=today).first()
            if todays_reservation is not None and todays_reservation.begins_at.astimezone(DEFAULT_TIMEZONE) <= now:
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
        old_reservations = instance.reservations.filter(begins_at__gt=now, state=ReservationStateChoice.CONFIRMED)
        ReservationStatistic.objects.filter(reservation__in=old_reservations).delete()
        old_reservations.delete()

        return instance.actions.bulk_create_reservation_for_periods(slots.non_overlapping, reservation_details)
