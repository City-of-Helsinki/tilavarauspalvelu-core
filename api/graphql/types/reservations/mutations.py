import graphene
from django.core.exceptions import ValidationError
from graphene import ClientIDMutation
from graphene_django.rest_framework.mutation import SerializerMutation
from rest_framework.generics import get_object_or_404
from sentry_sdk import capture_exception, push_scope

from api.graphql.extensions.legacy_helpers import OldAuthDeleteMutation, OldAuthSerializerMutation
from api.graphql.types.merchants.types import PaymentOrderType
from api.graphql.types.reservations.permissions import (
    ReservationCommentPermission,
    ReservationDenyPermission,
    ReservationHandlingPermission,
    ReservationPermission,
    ReservationRefundPermission,
    ReservationStaffCreatePermission,
    StaffAdjustTimePermission,
    StaffReservationModifyPermission,
)
from api.graphql.types.reservations.serializers import (
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
from api.graphql.types.reservations.serializers.refund_serializers import (
    ReservationRefundSerializer,
)
from api.graphql.types.reservations.serializers.staff_adjust_time_serializers import (
    StaffReservationAdjustTimeSerializer,
)
from api.graphql.types.reservations.serializers.staff_reservation_modify_serializers import (
    StaffReservationModifySerializer,
)
from api.graphql.types.reservations.types import ReservationType
from common.typing import GQLInfo
from merchants.models import OrderStatus, PaymentOrder
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.order.requests import cancel_order
from reservations.choices import ReservationStateChoice
from reservations.models import Reservation


class ReservationCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    reservation = graphene.Field(ReservationType)

    permission_classes = (ReservationPermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = ReservationCreateSerializer

    def resolve_reservation(root: Reservation, info: GQLInfo):
        reservation = Reservation.objects.filter(pk=root.pk).first()
        return reservation


class ReservationUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    reservation = graphene.Field(ReservationType)

    permission_classes = (ReservationPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationUpdateSerializer

    def resolve_reservation(root: Reservation, info: GQLInfo):
        reservation = Reservation.objects.filter(pk=root.pk).first()
        return reservation


class ReservationConfirmMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationPermission,)
    order = graphene.Field(PaymentOrderType)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationConfirmSerializer

    def resolve_order(root: Reservation, info: GQLInfo):
        payment_order = PaymentOrder.objects.filter(reservation__pk=root.pk).first()
        return payment_order


class ReservationCancellationMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationCancellationSerializer


class ReservationDenyMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationDenyPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationDenySerializer


class ReservationRefundMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationRefundPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationRefundSerializer


class ReservationApproveMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationHandlingPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationApproveSerializer


class ReservationRequiresHandlingMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationHandlingPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationRequiresHandlingSerializer


class ReservationWorkingMemoMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationCommentPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationWorkingMemoSerializer


class ReservationAdjustTimeMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationAdjustTimeSerializer


class ReservationStaffAdjustTimeMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (StaffAdjustTimePermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = StaffReservationAdjustTimeSerializer


class ReservationStaffModifyMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (StaffReservationModifyPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = StaffReservationModifySerializer


class ReservationDeleteMutation(OldAuthDeleteMutation, ClientIDMutation):
    permission_classes = (ReservationPermission,)
    model = Reservation

    @classmethod
    def validate(cls, root, info, **input):
        reservation = get_object_or_404(Reservation, pk=input.get("pk", None))
        if reservation.state not in (
            ReservationStateChoice.CREATED.value,
            ReservationStateChoice.WAITING_FOR_PAYMENT.value,
        ):
            raise ValidationError("Reservation which is not in created or waiting_for_payment state cannot be deleted.")

        payment_order: PaymentOrder = reservation.payment_order.first()
        if payment_order and payment_order.remote_id and payment_order.status != OrderStatus.CANCELLED.value:
            try:
                webshop_order = cancel_order(payment_order.remote_id, payment_order.reservation_user_uuid)

                if webshop_order and webshop_order.status == "cancelled":
                    payment_order.status = OrderStatus.CANCELLED
                    payment_order.save()
            except CancelOrderError as err:
                with push_scope() as scope:
                    scope.set_extra("details", "Order cancellation failed")
                    scope.set_extra("remote-id", payment_order.remote_id)
                    capture_exception(err)

                payment_order.status = OrderStatus.CANCELLED
                payment_order.save()


class ReservationStaffCreateMutation(OldAuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationStaffCreatePermission,)
    model = Reservation

    reservation = graphene.Field(ReservationType)

    class Meta:
        model_operations = ["create"]
        serializer_class = ReservationStaffCreateSerializer

    def resolve_reservation(root: Reservation, info: GQLInfo):
        reservation = Reservation.objects.filter(pk=root.pk).first()
        return reservation
