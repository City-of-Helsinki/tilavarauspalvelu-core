from __future__ import annotations

from typing import TYPE_CHECKING, Any

import graphene
from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation
from rest_framework.exceptions import ValidationError

from tilavarauspalvelu.api.graphql.types.payment_order.types import PaymentOrderNode
from tilavarauspalvelu.enums import AccessType, OrderStatus
from tilavarauspalvelu.integrations.keyless_entry import PindoraService
from tilavarauspalvelu.integrations.keyless_entry.exceptions import PindoraNotFoundError
from tilavarauspalvelu.integrations.verkkokauppa.payment.exceptions import GetPaymentError
from tilavarauspalvelu.models import Reservation
from tilavarauspalvelu.tasks import delete_pindora_reservation_task
from tilavarauspalvelu.typing import error_codes

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
    StaffChangeReservationAccessCodeSerializer,
    StaffReservationAdjustTimeSerializer,
    StaffReservationModifySerializer,
)
from .serializers.staff_repair_access_code_serializers import StaffRepairReservationAccessCodeSerializer

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PaymentOrder
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "ReservationAdjustTimeMutation",
    "ReservationApproveMutation",
    "ReservationCancellationMutation",
    "ReservationConfirmMutation",
    "ReservationCreateMutation",
    "ReservationDeleteTentativeMutation",
    "ReservationDenyMutation",
    "ReservationRefundMutation",
    "ReservationRequiresHandlingMutation",
    "ReservationStaffAdjustTimeMutation",
    "ReservationStaffChangeAccessCodeMutation",
    "ReservationStaffCreateMutation",
    "ReservationStaffModifyMutation",
    "ReservationStaffRepairAccessCodeMutation",
    "ReservationUpdateMutation",
    "ReservationWorkingMemoMutation",
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
        output["order"] = getattr(instance, "payment_order", None)
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


class ReservationDeleteTentativeMutation(DeleteMutation):
    """Used only for deleting a reservation before it is confirmed."""

    class Meta:
        model = Reservation
        permission_classes = [ReservationPermission]

    @classmethod
    def validate_deletion(cls, reservation: Reservation, user: AnyUser) -> None:
        reservation.validators.validate_can_be_deleted()

        if hasattr(reservation, "payment_order"):
            payment_order: PaymentOrder = reservation.payment_order

            try:
                payment_order.actions.refresh_order_status_from_webshop()
            except GetPaymentError as error:
                raise ValidationError(str(error), code=error_codes.EXTERNAL_SERVICE_ERROR) from error

            if payment_order.status in OrderStatus.paid_in_webshop:
                msg = "Reservation which is paid cannot be deleted."
                raise ValidationError(msg, code=error_codes.ORDER_CANCELLATION_NOT_ALLOWED)

            if payment_order.status not in OrderStatus.can_be_cancelled_statuses:
                return

            payment_order.actions.cancel_together_with_verkkokauppa(cancel_on_error=True)

        # Try Pindora delete, but if it fails, retry in background
        if reservation.access_type == AccessType.ACCESS_CODE:
            try:
                PindoraService.delete_access_code(obj=reservation)
            except PindoraNotFoundError:
                pass
            except Exception:  # noqa: BLE001
                delete_pindora_reservation_task.delay(str(reservation.ext_uuid))


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


class ReservationStaffChangeAccessCodeMutation(UpdateMutation):
    class Meta:
        serializer_class = StaffChangeReservationAccessCodeSerializer
        permission_classes = [StaffReservationModifyPermission]


class ReservationStaffRepairAccessCodeMutation(UpdateMutation):
    class Meta:
        serializer_class = StaffRepairReservationAccessCodeSerializer
        permission_classes = [StaffReservationModifyPermission]
