import datetime
from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice, ReservationTypeChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import AgeGroup, Reservation, ReservationPurpose, ReservationUnit, User
from tilavarauspalvelu.typing import StaffCreateReservationData, error_codes
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationStaffCreateMutation",
]


class ReservationStaffCreateMutation(MutationType[Reservation]):
    """Create a reservation as a staff user."""

    # Basic information
    name = Input(required=True, default_value="")
    description = Input(required=True, default_value="")
    num_persons = Input()
    working_memo = Input(required=True, default_value="")
    type = Input(required=True)
    municipality = Input()

    # Time information
    begins_at = Input(required=True)
    ends_at = Input(required=True)
    buffer_time_before = Input()
    buffer_time_after = Input()

    # Free of charge information
    applying_for_free_of_charge = Input(required=True, default_value=False)
    free_of_charge_reason = Input()

    # Reservee information
    reservee_identifier = Input(required=True, default_value="")
    reservee_first_name = Input(required=True, default_value="")
    reservee_last_name = Input(required=True, default_value="")
    reservee_email = Input()
    reservee_phone = Input(required=True, default_value="")
    reservee_organisation_name = Input(required=True, default_value="")
    reservee_address_street = Input(required=True, default_value="")
    reservee_address_city = Input(required=True, default_value="")
    reservee_address_zip = Input(required=True, default_value="")
    reservee_type = Input()

    # Relations
    reservation_unit = Input(ReservationUnit, required=True)
    age_group = Input(AgeGroup)
    purpose = Input(ReservationPurpose)

    @classmethod
    def __mutate__(cls, root: Any, info: GQLInfo[User], input_data: StaffCreateReservationData) -> Reservation:
        reservation_unit = input_data["reservation_unit"]

        user: User = info.context.user
        if not user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=True):
            msg = "No permission to create this reservation."
            raise GraphQLPermissionError(msg)

        reservation_type = input_data["type"]
        begins_at = input_data["begins_at"].astimezone(DEFAULT_TIMEZONE)
        ends_at = input_data["ends_at"].astimezone(DEFAULT_TIMEZONE)

        input_data.setdefault("buffer_time_before", datetime.timedelta())
        input_data.setdefault("buffer_time_after", datetime.timedelta())

        # For blocking reservations, buffer times can overlap existing reservations.
        if reservation_type == ReservationTypeChoice.BLOCKED:
            input_data["buffer_time_before"] = datetime.timedelta()
            input_data["buffer_time_after"] = datetime.timedelta()

        elif reservation_unit.reservation_block_whole_day:
            input_data["buffer_time_before"] = reservation_unit.actions.get_actual_before_buffer(begins_at)
            input_data["buffer_time_after"] = reservation_unit.actions.get_actual_after_buffer(ends_at)

        reservation_unit.validators.validate_can_create_reservation_type(reservation_type=reservation_type)
        reservation_unit.validators.validate_begin_before_end(begin=begins_at, end=ends_at)
        reservation_unit.validators.validate_reservation_begin_time_staff(begin=begins_at)
        reservation_unit.validators.validate_no_overlapping_reservations(
            begins_at=begins_at,
            ends_at=ends_at,
            new_buffer_time_before=input_data["buffer_time_before"],
            new_buffer_time_after=input_data["buffer_time_after"],
        )

        now = local_datetime()
        access_type = reservation_unit.actions.get_access_type_at(begins_at, default=AccessType.UNRESTRICTED)

        instance = Reservation()

        for key, value in input_data.items():
            setattr(instance, key, value)

        instance.begins_at = begins_at
        instance.ends_at = ends_at
        instance.user = user
        instance.handled_at = now
        instance.confirmed_at = now
        instance.state = ReservationStateChoice.CONFIRMED
        instance.reservee_used_ad_login = False if user.id_token is None else user.id_token.is_ad_login
        instance.access_type = access_type

        instance.save()

        # After creating the reservation, check again if there are any overlapping reservations.
        # This can fail if two reservations are created for reservation units in the same
        # space-resource hierarchy at almost the same time, meaning when we check for overlapping
        # reservations during validation, neither of the reservations are yet created.
        if instance.actions.overlapping_reservations().exists():
            instance.delete()
            msg = "Overlapping reservations were created at the same time."
            raise GraphQLValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        if instance.access_type == AccessType.ACCESS_CODE:
            is_active = instance.type != ReservationTypeChoice.BLOCKED
            # Allow mutation to succeed if Pindora request fails.
            try:
                PindoraService.create_access_code(obj=instance, is_active=is_active)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

        return instance
