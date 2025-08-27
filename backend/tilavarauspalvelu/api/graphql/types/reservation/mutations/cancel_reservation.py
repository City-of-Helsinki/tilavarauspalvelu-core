from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.tasks import (
    cancel_payment_order_for_invoice_task,
    cancel_payment_order_without_webshop_payment_task,
    refund_payment_order_for_webshop_task,
)
from tilavarauspalvelu.typing import ReservationCancelData, error_codes
from utils.date_utils import DEFAULT_TIMEZONE
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationCancelMutation",
]


class ReservationCancelMutation(MutationType[Reservation], kind="update"):
    """Cancel a reservation."""

    pk = Input(required=True)
    cancel_reason = Input(required=True)
    cancel_details = Input(required=True, default_value="")

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: ReservationCancelData) -> Reservation:
        user = info.context.user
        if not user.permissions.can_manage_reservation(instance):
            msg = "No permission to approve reservation."
            raise GraphQLPermissionError(msg)

        begin = instance.begins_at.astimezone(DEFAULT_TIMEZONE)

        instance.validators.validate_reservation_state_allows_cancelling()
        instance.validators.validate_reservation_type_allows_cancelling()
        instance.validators.validate_reservation_not_past_or_ongoing()

        reservation_unit = instance.reservation_unit
        reservation_unit.validators.validate_cancellation_rule(begin=begin)

        previous_data: dict[str, Any] = {
            "cancel_reason": instance.cancel_reason,
            "cancel_details": instance.cancel_details,
            "state": instance.state,
        }

        instance.cancel_reason = input_data["cancel_reason"]
        instance.cancel_details = input_data["cancel_details"]
        instance.state = ReservationStateChoice.CANCELLED
        instance.save()

        if instance.access_type == AccessType.ACCESS_CODE:
            try:
                PindoraService.delete_access_code(obj=instance)
            except PindoraNotFoundError:
                pass
            except ExternalServiceError as error:
                cls.rollback(instance=instance, previous_data=previous_data)
                raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

        if hasattr(instance, "payment_order"):
            payment_order = instance.payment_order

            if payment_order.actions.is_refundable():
                refund_payment_order_for_webshop_task.delay(payment_order.pk)

            elif payment_order.actions.is_cancellable_invoice():
                cancel_payment_order_for_invoice_task.delay(payment_order.pk)

            elif payment_order.actions.has_no_payment_through_webshop():
                cancel_payment_order_without_webshop_payment_task.delay(payment_order.pk)

        EmailService.send_reservation_cancelled_email(reservation=instance)

        return instance

    @classmethod
    def rollback(cls, instance: Reservation, previous_data: dict[str, Any]) -> None:
        for key, value in previous_data.items():
            setattr(instance, key, value)
        instance.save()
