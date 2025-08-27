import datetime
from typing import Any, TypedDict

from graphql import GraphQLOutputType
from undine import GQLInfo, Input, MutationType
from undine.converters import convert_to_graphql_type
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation, ReservationSeries, User
from tilavarauspalvelu.typing import error_codes
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationSeriesRepairAccessCodeMutation",
]


class ReservationSeriesRepairAccessCodeMutationOutput(TypedDict):
    access_code_generated_at: datetime.datetime | None
    access_code_is_active: bool


class ReservationSeriesRepairAccessCodeMutation(MutationType[ReservationSeries], kind="update"):
    """
    Synchronize the state of the reservation series' access code between Varaamo and Pindora
    to what Varaamo thinks is should be its correct state.
    """

    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: ReservationSeries, info: GQLInfo[User], input_data: dict[str, Any]) -> Any:
        reservation_unit = instance.reservation_unit

        user = info.context.user
        is_reservee = instance.user == user
        if not user.permissions.can_create_staff_reservation(reservation_unit, is_reservee=is_reservee):
            msg = "No permission to access reservation series."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_series_has_ongoing_or_future_reservations()
        instance.validators.validate_has_access_code_access_type()
        instance.validators.validate_requires_active_access_code()

        no_access_code_before = instance.actions.has_inactive_access_codes_which_should_be_active()

        try:
            PindoraService.sync_access_code(obj=instance)
        except ExternalServiceError as error:
            raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        has_access_code_after = instance.actions.has_upcoming_or_ongoing_reservations_with_active_access_codes()

        if instance.allocated_time_slot is not None:
            section = instance.allocated_time_slot.reservation_unit_option.application_section

            if no_access_code_before and has_access_code_after:
                EmailService.send_seasonal_booking_access_code_added_email(section)

        last_reservation: Reservation = instance.reservations.requires_active_access_code().last()
        return ReservationSeriesRepairAccessCodeMutationOutput(
            access_code_generated_at=last_reservation.access_code_generated_at,
            access_code_is_active=last_reservation.access_code_is_active,
        )

    @classmethod
    def __output_type__(cls) -> GraphQLOutputType:
        return convert_to_graphql_type(ReservationSeriesRepairAccessCodeMutationOutput)
