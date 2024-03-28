from typing import Any

import graphene
from django.core.exceptions import ValidationError
from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from api.graphql.types.merchants.types import PaymentOrderNode
from common.typing import AnyUser
from merchants.models import OrderStatus, PaymentOrder
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.verkkokauppa_api_client import VerkkokauppaAPIClient
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation
from utils.sentry import SentryLogger

from .permissions import (
    ReservationCommentPermission,
    ReservationDenyPermission,
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
        permission_classes = [ReservationDenyPermission]


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
    def validate_deletion(cls, instance: Reservation, user: AnyUser):
        if instance.state not in (
            ReservationStateChoice.CREATED.value,
            ReservationStateChoice.WAITING_FOR_PAYMENT.value,
        ):
            msg = "Reservation which is not in created or waiting_for_payment state cannot be deleted."
            raise ValidationError(msg)

        payment_order: PaymentOrder = instance.payment_order.first()
        if payment_order and payment_order.remote_id and payment_order.status != OrderStatus.CANCELLED.value:
            try:
                webshop_order = VerkkokauppaAPIClient.cancel_order(
                    order_uuid=payment_order.remote_id,
                    user_uuid=payment_order.reservation_user_uuid,
                )

                if webshop_order and webshop_order.status == "cancelled":
                    payment_order.status = OrderStatus.CANCELLED
                    payment_order.save()

            except CancelOrderError as err:
                SentryLogger.log_exception(err, details="Order cancellation failed", remote_id=payment_order.remote_id)
                payment_order.status = OrderStatus.CANCELLED
                payment_order.save()
