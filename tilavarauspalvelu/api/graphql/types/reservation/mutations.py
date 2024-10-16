from typing import TYPE_CHECKING, Any

import graphene
from django.core.exceptions import ValidationError
from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.api.graphql.types.merchants.types import PaymentOrderNode
from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.typing import AnyUser
from tilavarauspalvelu.utils.verkkokauppa.order.exceptions import CancelOrderError
from utils.date_utils import local_datetime

from .permissions import (
    ReservationCommentPermission,
    ReservationHandlingPermission,
    ReservationPermission,
    ReservationRefundPermission,
    ReservationStaffCreatePermission,
    StaffAdjustTimePermission,
    StaffReservationModifyPermission,
)
from .serializers import (
    ReservationAdjustTimeSerializer,
    ReservationApproveSerializer,
    ReservationCancellationSerializer,
    ReservationConfirmSerializer,
    ReservationCreateSerializer,
    ReservationDenySerializer,
    ReservationRequiresHandlingSerializer,
    ReservationStaffCreateSerializer,
    ReservationUpdateSerializer,
    ReservationWorkingMemoSerializer,
)
from .serializers.refund_serializers import ReservationRefundSerializer
from .serializers.staff_adjust_time_serializers import StaffReservationAdjustTimeSerializer
from .serializers.staff_reservation_modify_serializers import StaffReservationModifySerializer

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder

__all__ = [
    "ReservationCreateMutation",
]


class ReservationCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationCreateSerializer
        permission_classes = [ReservationPermission]


class ReservationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationUpdateSerializer
        permission_classes = [ReservationPermission]


class ReservationConfirmMutation(UpdateMutation):
    order = graphene.Field(PaymentOrderNode)

    class Meta:
        serializer_class = ReservationConfirmSerializer
        permission_classes = [ReservationPermission]

    @classmethod
    def get_serializer_output(cls, instance: Reservation) -> dict[str, Any]:
        output = super().get_serializer_output(instance)
        output["order"] = instance.payment_order.first()
        return output


class ReservationCancellationMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationCancellationSerializer
        permission_classes = [ReservationPermission]


class ReservationDenyMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationDenySerializer
        permission_classes = [ReservationHandlingPermission]


class ReservationRefundMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationRefundSerializer
        permission_classes = [ReservationRefundPermission]


class ReservationApproveMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationApproveSerializer
        permission_classes = [ReservationHandlingPermission]


class ReservationRequiresHandlingMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationRequiresHandlingSerializer
        permission_classes = [ReservationHandlingPermission]


class ReservationWorkingMemoMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationWorkingMemoSerializer
        permission_classes = [ReservationCommentPermission]


class ReservationAdjustTimeMutation(UpdateMutation):
    class Meta:
        serializer_class = ReservationAdjustTimeSerializer
        permission_classes = [ReservationPermission]


# Staff mutations


class ReservationStaffCreateMutation(CreateMutation):
    class Meta:
        serializer_class = ReservationStaffCreateSerializer
        permission_classes = [ReservationStaffCreatePermission]


class ReservationStaffAdjustTimeMutation(UpdateMutation):
    class Meta:
        serializer_class = StaffReservationAdjustTimeSerializer
        permission_classes = [StaffAdjustTimePermission]


class ReservationStaffModifyMutation(UpdateMutation):
    class Meta:
        serializer_class = StaffReservationModifySerializer
        permission_classes = [StaffReservationModifyPermission]


class ReservationDeleteMutation(DeleteMutation):
    class Meta:
        model = Reservation
        permission_classes = [ReservationPermission]

    @classmethod
    def validate_deletion(cls, reservation: Reservation, user: AnyUser) -> None:
        # Check Reservation state
        if reservation.state not in ReservationStateChoice.states_that_can_be_cancelled:
            msg = (
                f"Reservation which is not in {ReservationStateChoice.states_that_can_be_cancelled} "
                f"state cannot be deleted."
            )
            raise ValidationError(msg)

        # Verify PaymentOrder status from the webshop
        payment_order: PaymentOrder = reservation.payment_order.first()
        if payment_order and payment_order.remote_id:
            payment_order.actions.refresh_order_status_from_webshop()

            # If the PaymentOrder is marked as paid, prevent the deletion.
            if payment_order.status == OrderStatus.PAID:
                msg = "Reservation which is paid cannot be deleted."
                raise ValidationError(msg)

            if payment_order.status in OrderStatus.can_be_cancelled_statuses:
                # Status should be updated if the webshop call errors or the order is successfully cancelled
                # When the webshop returns any other status than "cancelled", the payment_order status is not updated
                try:
                    webshop_order = payment_order.actions.cancel_order_in_webshop()
                    if not webshop_order or webshop_order.status != "cancelled":
                        return
                except CancelOrderError:
                    pass

                payment_order.status = OrderStatus.CANCELLED
                payment_order.processed_at = local_datetime()
                payment_order.save(update_fields=["status", "processed_at"])
