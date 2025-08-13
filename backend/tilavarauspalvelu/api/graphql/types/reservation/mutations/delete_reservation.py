from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError, GraphQLValidationError

from tilavarauspalvelu.enums import AccessType, OrderStatus
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.models import Reservation, User
from tilavarauspalvelu.tasks import delete_pindora_reservation_task
from tilavarauspalvelu.typing import error_codes

__all__ = [
    "ReservationDeleteTentativeMutation",
]


class ReservationDeleteTentativeMutation(MutationType[Reservation]):
    """Delete a reservation before it's confirmed."""

    pk = Input(required=True)

    @classmethod
    def __permissions__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_reservation(instance):
            msg = "No permission to delete this reservation."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: Reservation, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        instance.validators.validate_can_be_deleted()

        if hasattr(instance, "payment_order"):
            payment_order = instance.payment_order

            try:
                payment_order.actions.refresh_order_status_from_webshop()
            except GetPaymentError as error:
                raise GraphQLValidationError(str(error), code=error_codes.EXTERNAL_SERVICE_ERROR) from error

            if payment_order.status in OrderStatus.paid_in_webshop:
                msg = "Reservation which is paid cannot be deleted."
                raise GraphQLValidationError(msg, code=error_codes.ORDER_CANCELLATION_NOT_ALLOWED)

            if payment_order.status in OrderStatus.can_be_cancelled_statuses:
                payment_order.actions.cancel_together_with_verkkokauppa(cancel_on_error=True)

        # Try Pindora delete, but if it fails, retry in background
        if instance.access_type == AccessType.ACCESS_CODE:
            try:
                PindoraService.delete_access_code(obj=instance)
            except PindoraNotFoundError:
                pass
            except Exception:  # noqa: BLE001
                delete_pindora_reservation_task.delay(str(instance.ext_uuid))
