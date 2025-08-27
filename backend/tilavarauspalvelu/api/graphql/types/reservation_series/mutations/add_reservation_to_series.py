import datetime
import uuid

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, ReservationSeries, User
from tilavarauspalvelu.typing import ReservationSeriesAddData, error_codes
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationSeriesAddMutation",
]


class ReservationSeriesAddMutation(MutationType[ReservationSeries], kind="update"):
    """Add a reservation to a reservation series."""

    pk = Input(required=True)

    begins_at = Input(datetime.datetime, required=True, input_only=False)
    ends_at = Input(datetime.datetime, required=True, input_only=False)
    buffer_time_before = Input(datetime.timedelta, required=False, input_only=False)
    buffer_time_after = Input(datetime.timedelta, required=False, input_only=False)

    @classmethod
    def __mutate__(
        cls,
        instance: ReservationSeries,
        info: GQLInfo[User],
        input_data: ReservationSeriesAddData,
    ) -> ReservationSeries:
        reservation_unit = instance.reservation_unit

        user = info.context.user
        is_reservee = instance.user == user
        if not user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=is_reservee):
            msg = "No permission to access reservation series."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_has_reservations()

        # Use last reservation in the series as the base for the new reservation
        # (not first since past reservations could have outdated data if series has been updated).
        reservation = instance.reservations.last()

        begins_at = input_data["begins_at"].astimezone(DEFAULT_TIMEZONE)
        ends_at = input_data["ends_at"].astimezone(DEFAULT_TIMEZONE)

        buffer_time_before = input_data.get("buffer_time_before", reservation_unit.buffer_time_before)
        buffer_time_after = input_data.get("buffer_time_after", reservation_unit.buffer_time_after)

        # Buffers should not be used for blocking reservations
        if reservation.type == ReservationTypeChoice.BLOCKED:
            buffer_time_before = datetime.timedelta()
            buffer_time_after = datetime.timedelta()

        elif reservation_unit.reservation_block_whole_day:
            buffer_time_before = reservation_unit.actions.get_actual_before_buffer(begins_at)
            buffer_time_after = reservation_unit.actions.get_actual_after_buffer(ends_at)

        reservation_unit.validators.validate_begin_before_end(begins_at, ends_at)
        reservation_unit.validators.validate_reservation_begin_time_staff(begin=begins_at)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begins_at=begins_at,
            ends_at=ends_at,
            new_buffer_time_before=buffer_time_before,
            new_buffer_time_after=buffer_time_after,
        )

        access_type = reservation_unit.actions.get_access_type_at(begins_at, default=AccessType.UNRESTRICTED)

        reservation = cls.add_new(
            reservation=reservation,
            begins_at=begins_at,
            ends_at=ends_at,
            buffer_time_before=buffer_time_before,
            buffer_time_after=buffer_time_after,
            access_type=access_type,
        )

        # After adding a new reservation, check for overlapping reservations again.
        # This can fail if another reservation is created of moved to the same time
        # in a reservation unit in the same space-resource hierarchy at almost the same time.
        if reservation.actions.overlapping_reservations().exists():
            reservation.delete()
            msg = "Overlapping reservations were created at the same time."
            raise GraphQLValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        cls.handle_access_code(reservation)
        return instance

    @classmethod
    def add_new(  # noqa: PLR0917
        cls,
        reservation: Reservation,
        begins_at: datetime.datetime,
        ends_at: datetime.datetime,
        buffer_time_before: datetime.timedelta,
        buffer_time_after: datetime.timedelta,
        access_type: AccessType,
    ) -> Reservation:
        now = local_datetime()

        # A little trick for making a copy of an existing instance
        # See: https://docs.djangoproject.com/en/stable/topics/db/queries/#copying-model-instances
        reservation._state.adding = True  # noqa: SLF001
        reservation.id = None
        reservation.pk = None

        reservation.begins_at = begins_at
        reservation.ends_at = ends_at
        reservation.buffer_time_before = buffer_time_before
        reservation.buffer_time_after = buffer_time_after
        reservation.access_type = access_type

        # Will be updated by client if has access code.
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
        return reservation

    @classmethod
    def handle_access_code(cls, instance: Reservation) -> None:
        # Reschedule Pindora series or seasonal booking if new reservation uses access code
        if instance.access_type != AccessType.ACCESS_CODE:
            return

        # Allow mutation to succeed if Pindora request fails.
        try:
            try:
                PindoraService.reschedule_access_code(instance)
            except PindoraNotFoundError:
                PindoraService.create_access_code(instance, is_active=True)
        except ExternalServiceError as error:
            SentryLogger.log_exception(error, details=f"Reservation series: {instance.pk}")
