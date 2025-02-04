from __future__ import annotations

from typing import TYPE_CHECKING, Any

import graphene
from django.conf import settings
from django.core.exceptions import ValidationError
from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.api.graphql.types.merchants.types import PaymentOrderNode
from tilavarauspalvelu.enums import OrderStatus, ReservationStateChoice
from tilavarauspalvelu.integrations.keyless_entry import PindoraClient
from tilavarauspalvelu.integrations.verkkokauppa.order.exceptions import CancelOrderError
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import delete_pindora_reservation

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
    ReservationRefundSerializer,
    ReservationRequiresHandlingSerializer,
    ReservationStaffCreateSerializer,
    ReservationUpdateSerializer,
    ReservationWorkingMemoSerializer,
    StaffReservationAdjustTimeSerializer,
    StaffReservationModifySerializer,
)

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder
    from tilavarauspalvelu.typing import AnyUser

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


class ReservationDeleteTentativeMutation(DeleteMutation):
    """Used only for deleting a reservation before it is confirmed."""

    class Meta:
        model = Reservation
        permission_classes = [ReservationPermission]

    @classmethod
    def validate_deletion(cls, reservation: Reservation, user: AnyUser) -> None:
        # Check Reservation state
        if reservation.state not in ReservationStateChoice.states_that_can_be_deleted:
            msg = (
                f"Reservation which is not in {ReservationStateChoice.states_that_can_be_deleted} "
                f"state cannot be deleted."
            )
            raise ValidationError(msg)

        payment_order: PaymentOrder | None = reservation.payment_order.first()
        if payment_order is not None:
            cls.validate_payment_order(payment_order)

        # Try Pindora delete, but if it fails, retry in background
        try:
            PindoraClient.delete_reservation(reservation=reservation)
        except Exception:  # noqa: BLE001
            delete_pindora_reservation.delay(str(reservation.ext_uuid))

    @classmethod
    def validate_payment_order(cls, payment_order: PaymentOrder) -> None:
        if settings.MOCK_VERKKOKAUPPA_API_ENABLED:
            if payment_order.status in OrderStatus.can_be_cancelled_statuses:
                payment_order.actions.set_order_as_cancelled()
            return

        if not payment_order.remote_id:
            return

        # Verify PaymentOrder status from the webshop
        payment_order.actions.refresh_order_status_from_webshop()

        # If the PaymentOrder is marked as paid, prevent the deletion.
        if payment_order.status == OrderStatus.PAID:
            msg = "Reservation which is paid cannot be deleted."
            raise ValidationError(msg)

        if payment_order.status not in OrderStatus.can_be_cancelled_statuses:
            return

        # Status should be updated if the webshop call errors or the order is successfully cancelled
        # When the webshop returns any other status than "cancelled", the payment_order status is not updated
        try:
            webshop_order = payment_order.actions.cancel_order_in_webshop()
            if not webshop_order or webshop_order.status != "cancelled":
                return
        except CancelOrderError:
            pass

        payment_order.actions.set_order_as_cancelled()


class ReservationDeleteMutation(ReservationDeleteTentativeMutation):
    # TODO: Remove after frontend is updated to use ReservationDeleteTentativeMutation
    class Meta:
        model = Reservation
        permission_classes = [ReservationPermission]
