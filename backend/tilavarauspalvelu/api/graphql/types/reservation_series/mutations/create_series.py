import datetime

from django.conf import settings
from django.db import transaction
from graphql import GraphQLError
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.enums import ReservationStateChoice, ReservationTypeStaffChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import AgeGroup, Reservation, ReservationPurpose, ReservationSeries, ReservationUnit, User
from tilavarauspalvelu.tasks import create_statistics_for_reservations_task
from tilavarauspalvelu.typing import ReservationDetails, ReservationSeriesCreateData, error_codes
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationSeriesCreateMutation",
]


class ReservationSeriesReservationCreateInput(MutationType[Reservation], kind="related"):
    # Basic information
    name = Input(required=True, default_value="")
    description = Input(required=True, default_value="")
    num_persons = Input(required=True, default_value=None)
    state = Input(required=True, default_value=ReservationStateChoice.CONFIRMED)
    type = Input(ReservationTypeStaffChoice, required=True, default_value=ReservationTypeStaffChoice.STAFF)
    working_memo = Input(required=True, default_value="")
    municipality = Input(default_value=None)

    # Time information
    buffer_time_before = Input(required=False)
    buffer_time_after = Input(required=False)
    handled_at = Input(default_value=None)
    confirmed_at = Input(default_value=None)

    # Free of charge information
    applying_for_free_of_charge = Input(required=True, default_value=False)
    free_of_charge_reason = Input(default_value=None)

    # Reservee information
    reservee_identifier = Input(required=True, default_value="")
    reservee_first_name = Input(required=True, default_value="")
    reservee_last_name = Input(required=True, default_value="")
    reservee_email = Input(default_value=None)
    reservee_phone = Input(required=True, default_value="")
    reservee_organisation_name = Input(required=True, default_value="")
    reservee_address_street = Input(required=True, default_value="")
    reservee_address_city = Input(required=True, default_value="")
    reservee_address_zip = Input(required=True, default_value="")
    reservee_type = Input(default_value=None)

    # Relations
    user = Input(User)
    purpose = Input(ReservationPurpose)


class ReservationSeriesCreateMutation(MutationType[ReservationSeries], kind="create"):
    """Create the reservation series with all its reservations."""

    name = Input(required=True, default_value="")
    description = Input(required=True, default_value="")

    begin_time = Input(required=True)
    end_time = Input(required=True)
    begin_date = Input(required=True)
    end_date = Input(required=True)
    weekdays = Input(required=True)
    recurrence_in_days = Input(required=True)

    reservation_unit = Input(ReservationUnit, required=True)
    age_group = Input(AgeGroup)

    reservation_details = Input(ReservationSeriesReservationCreateInput, many=False, required=True)
    check_opening_hours = Input(bool, default_value=False, input_only=False)
    skip_dates = Input(list[datetime.date], default_value=[], input_only=False)

    @classmethod
    def __mutate__(
        cls,
        instance: ReservationSeries,
        info: GQLInfo[User],
        input_data: ReservationSeriesCreateData,
    ) -> ReservationSeries:
        reservation_unit = input_data["reservation_unit"]

        user: User = info.context.user
        if not user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=True):
            msg = "No permission to create reservation series."
            raise GraphQLPermissionError(msg)

        ReservationSeries.validators.validate_recurrence_in_days(input_data["recurrence_in_days"])
        ReservationSeries.validators.validate_series_time_slots(
            begin_date=input_data["begin_date"],
            begin_time=input_data["begin_time"],
            end_date=input_data["end_date"],
            end_time=input_data["end_time"],
            reservation_start_interval=reservation_unit.reservation_start_interval,
        )

        reservation_details = input_data["reservation_details"]
        skip_dates = input_data["skip_dates"]
        check_opening_hours = input_data["check_opening_hours"]

        # Create both the reservation series and the reservations in a transaction.
        # This way if we get, e.g., overlapping reservations, the whole operation is rolled back.
        with transaction.atomic():
            instance = cls.create_series(input_data=input_data, user=user)
            reservations = cls.create_reservations(
                instance=instance,
                reservation_details=reservation_details,
                skip_dates=skip_dates,
                check_opening_hours=check_opening_hours,
            )

        # Create any access codes if any reservations require them.
        if instance.reservations.all().requires_active_access_code().exists():
            # Allow mutation to succeed if Pindora request fails.
            try:
                PindoraService.create_access_code(instance, is_active=True)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation series: {instance.pk}")

        # Must refresh the materialized view since new reservations are created.
        # TODO: Disabled for now, since it might contribute to timeouts in production.
        #  Refresh still happens on a background task every 2 minutes.
        #  if settings.UPDATE_AFFECTING_TIME_SPANS:  # noqa: ERA001,RUF100
        #      update_affecting_time_spans_task.delay()  # noqa: ERA001,RUF100

        if settings.SAVE_RESERVATION_STATISTICS:
            create_statistics_for_reservations_task.delay(
                reservation_pks=[reservation.pk for reservation in reservations],
            )

        return instance

    @classmethod
    def create_series(cls, input_data: ReservationSeriesCreateData, user: User) -> ReservationSeries:
        series = ReservationSeries()
        series.user = user

        for key, value in input_data.items():
            setattr(series, key, value)

        series.save()
        return series

    @classmethod
    def create_reservations(
        cls,
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
