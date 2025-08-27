from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, PaymentType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.sentry import SentryLogger
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.typing import error_codes
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationConfirmMutation",
]


class ReservationConfirmMutation(MutationType[Reservation], kind="update"):
    """Confirm a tentative reservation. Reservation might still require handling and/or payment."""

    pk = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> Reservation:
        user = info.context.user
        if not user.permissions.can_manage_reservation(instance):
            msg = "No permission to confirm reservation."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_can_change_reservation()
        instance.validators.validate_no_payment_order()
        instance.validators.validate_required_metadata_fields()

        if instance.price_net == 0:
            state = instance.actions.get_state_on_reservation_confirmed(payment_type=None)

        else:
            reservation_unit = instance.reservation_unit
            pricing = reservation_unit.actions.get_active_pricing(by_date=instance.begins_at.date())

            if pricing is None:
                msg = "No pricing found for the given date."
                raise GraphQLValidationError(msg, code=error_codes.RESERVATION_UNIT_NO_ACTIVE_PRICING)

            pricing.validators.validate_has_payment_type()

            payment_type: PaymentType = pricing.payment_type

            if payment_type != PaymentType.ON_SITE:
                reservation_unit.validators.validate_has_payment_product()

            state = instance.actions.get_state_on_reservation_confirmed(payment_type=payment_type)

            if state.should_create_payment_order:
                instance.actions.create_payment_order_paid_immediately(payment_type=payment_type)

        instance.state = state
        instance.confirmed_at = local_datetime()
        instance.save()

        if instance.state == ReservationStateChoice.CONFIRMED:
            if instance.access_type == AccessType.ACCESS_CODE:
                # Allow activation in Pindora to fail, will be handled by a background task.
                try:
                    PindoraService.activate_access_code(obj=instance)
                except ExternalServiceError as error:
                    SentryLogger.log_exception(error, details=f"Reservation: {instance.pk}")

            EmailService.send_reservation_confirmed_email(reservation=instance)
            EmailService.send_reservation_confirmed_staff_notification_email(reservation=instance)

        elif instance.state == ReservationStateChoice.REQUIRES_HANDLING:
            EmailService.send_reservation_requires_handling_email(reservation=instance)
            EmailService.send_reservation_requires_handling_staff_notification_email(reservation=instance)

        return instance
