from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationRequiresHandlingMutation",
]


class ReservationRequiresHandlingMutation(MutationType[Reservation], kind="update"):
    """Move an 'approved' or 'denied' reservation back to 'requires handling' state."""

    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> Reservation:
        user = info.context.user
        if not user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        ):
            msg = "No permission to handle this reservation."
            raise GraphQLPermissionError(msg)

        begin = instance.begins_at.astimezone(DEFAULT_TIMEZONE)
        end = instance.ends_at.astimezone(DEFAULT_TIMEZONE)
        was_denied = instance.state == ReservationStateChoice.DENIED

        instance.validators.validate_reservation_state_allows_handling()

        if was_denied:
            reservation_unit = instance.reservation_unit
            reservation_unit.validators.validate_no_overlapping_reservations(begins_at=begin, ends_at=end)

        if hasattr(instance, "payment_order"):
            payment_order = instance.payment_order
            if payment_order.actions.has_no_payment_through_webshop():
                payment_order.actions.cancel_together_with_verkkokauppa(cancel_on_error=True)

        instance.state = ReservationStateChoice.REQUIRES_HANDLING
        instance.save(update_fields=["state"])

        # If the reservation was changed from 'DENIED' to 'REQUIRES_HANDLING' in this mutation,
        # it means that the reservation is going to happen again. This is analogous to creating a new reservation,
        # so we must check for overlapping reservations again. This can fail if another reservation
        # is created (or "un-denied") for the same reservation unit at almost the same time.
        if was_denied and instance.actions.overlapping_reservations().exists():
            instance.state = ReservationStateChoice.DENIED
            instance.save(update_fields=["state"])

            msg = "Overlapping reservations were created at the same time."
            raise GraphQLValidationError(msg, code=error_codes.OVERLAPPING_RESERVATIONS)

        # Denied reservations shouldn't have an access code. It will be regenerated if the reservation is approved.
        if instance.access_type == AccessType.ACCESS_CODE:
            # Allow mutation to succeed if Pindora request fails.
            try:
                PindoraService.deactivate_access_code(obj=instance)
            except ExternalServiceError as error:
                SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

        EmailService.send_reservation_requires_handling_email(reservation=instance)
        return instance
