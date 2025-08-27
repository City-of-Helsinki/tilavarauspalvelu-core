from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.typing import error_codes
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationStaffChangeAccessCodeMutation",
]


class ReservationStaffChangeAccessCodeMutation(MutationType[Reservation], kind="update"):
    """Change the access code of a reservation."""

    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> Reservation:
        user = info.context.user
        if not user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        ):
            msg = "No permission to change this reservation's access code."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_reservation_has_access_code()
        instance.validators.validate_reservation_state_allows_access_code_change()
        instance.validators.validate_reservation_type_allows_access_code_change()
        instance.validators.validate_reservation_has_not_ended()
        instance.validators.validate_not_in_reservation_series()

        try:
            response = PindoraService.change_access_code(obj=instance)

        except PindoraNotFoundError:
            instance.access_code_generated_at = None
            instance.access_code_is_active = False
            instance.save(update_fields=["access_code_generated_at", "access_code_is_active"])
            return instance

        except ExternalServiceError as error:
            raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        access_code_is_active = response["access_code_is_active"]

        if not access_code_is_active:
            try:
                PindoraService.activate_access_code(obj=instance)
                access_code_is_active = True
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

        if access_code_is_active:
            EmailService.send_reservation_access_code_changed_email(reservation=instance)

        return instance
