from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.typing import error_codes
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationStaffRepairAccessCodeMutation",
]


class ReservationStaffRepairAccessCodeMutation(MutationType[Reservation], kind="update"):
    """
    Synchronize the state of the reservation's access code between Varaamo and Pindora
    to what Varaamo thinks is should be its correct state.
    """

    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> Reservation:
        user = info.context.user
        if not user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        ):
            msg = "No permission to update this reservation."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_reservation_access_type_is_access_code()
        instance.validators.validate_reservation_has_not_ended()
        instance.validators.validate_not_in_reservation_series()

        no_access_code_before = instance.access_code_generated_at is None or not instance.access_code_is_active

        try:
            PindoraService.sync_access_code(obj=instance)
        except ExternalServiceError as error:
            raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        has_access_code_after = instance.access_code_generated_at is not None and instance.access_code_is_active

        if no_access_code_before and has_access_code_after:
            EmailService.send_reservation_access_code_added_email(reservation=instance)

        return instance
