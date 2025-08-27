from contextlib import suppress

from django.db import transaction
from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.email.main import EmailService
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.models import Reservation, ReservationDenyReason, User
from tilavarauspalvelu.typing import ReservationDenyData, error_codes
from utils.date_utils import local_datetime
from utils.external_service.errors import ExternalServiceError

__all__ = [
    "ReservationDenyMutation",
]


class ReservationDenyMutation(MutationType[Reservation], kind="update"):
    """Deny a reservation during handling."""

    pk = Input(required=True)
    deny_reason = Input(ReservationDenyReason, required=True)
    handling_details = Input(required=True)

    @classmethod
    def __mutate__(cls, instance: Reservation, info: GQLInfo[User], input_data: ReservationDenyData) -> Reservation:
        user = info.context.user
        if not user.permissions.can_manage_reservation(
            instance,
            reserver_needs_role=True,
            allow_reserver_role_for_own_reservations=True,
        ):
            msg = "No permission to deny this reservation."
            raise GraphQLPermissionError(msg)

        instance.validators.validate_reservation_state_allows_denying()

        if hasattr(instance, "payment_order"):
            payment_order = instance.payment_order

            order_status_before = payment_order.status

            # If refresh fails, still allow the reservation to be denied
            with suppress(GetPaymentError):
                payment_order.actions.refresh_order_status_from_webshop()

            order_status_after = payment_order.status

            if order_status_before != order_status_after and order_status_after in OrderStatus.paid_in_webshop:
                msg = "Payment order status has changed to paid. Must re-evaluate if reservation should be denied."
                raise GraphQLValidationError(msg, code=error_codes.ORDER_STATUS_CHANGED)

        with transaction.atomic():
            if hasattr(instance, "payment_order"):
                payment_order = instance.payment_order

                # Only cancel unpaid orders. Refunds are made optionally with 'ReservationRefundMutation'.
                if payment_order.actions.has_no_payment_through_webshop():
                    payment_order.actions.cancel_together_with_verkkokauppa(cancel_on_error=True)

            if instance.access_type == AccessType.ACCESS_CODE:
                try:
                    PindoraService.delete_access_code(obj=instance)
                except PindoraNotFoundError:
                    pass
                except ExternalServiceError as error:
                    raise GraphQLValidationError(str(error), code=error_codes.PINDORA_ERROR) from error

            instance.state = ReservationStateChoice.DENIED
            instance.handled_at = local_datetime()
            instance.handling_details = input_data["handling_details"]
            instance.deny_reason = input_data["deny_reason"]
            instance.save()

        EmailService.send_reservation_denied_email(reservation=instance)

        return instance
