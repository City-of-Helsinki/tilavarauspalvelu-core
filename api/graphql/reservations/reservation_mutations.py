import graphene
from django.core.exceptions import ValidationError
from graphene import ClientIDMutation, ResolveInfo
from graphene_django.rest_framework.mutation import SerializerMutation
from rest_framework.generics import get_object_or_404
from sentry_sdk import capture_message

from api.graphql.base_mutations import AuthDeleteMutation, AuthSerializerMutation
from api.graphql.merchants.merchant_types import PaymentOrderType
from api.graphql.reservations.reservation_serializers import (
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
from api.graphql.reservations.reservation_types import ReservationType
from api.graphql.validation_errors import ValidationErrorCodes, ValidationErrorWithCode
from merchants.models import OrderStatus, PaymentOrder
from merchants.verkkokauppa.order.exceptions import CancelOrderError
from merchants.verkkokauppa.order.requests import cancel_order
from permissions.api_permissions.graphene_permissions import (
    ReservationCommentPermission,
    ReservationHandlingPermission,
    ReservationPermission,
    ReservationStaffCreatePermission,
)
from reservations.models import STATE_CHOICES as ReservationState
from reservations.models import Reservation


class ReservationCreateMutation(AuthSerializerMutation, SerializerMutation):
    reservation = graphene.Field(ReservationType)

    permission_classes = (ReservationPermission,)

    class Meta:
        model_operations = ["create"]
        serializer_class = ReservationCreateSerializer

    def resolve_reservation(self, info: ResolveInfo):
        reservation = Reservation.objects.filter(pk=self.pk).first()
        return reservation


class ReservationUpdateMutation(AuthSerializerMutation, SerializerMutation):
    reservation = graphene.Field(ReservationType)

    permission_classes = (ReservationPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationUpdateSerializer

    def resolve_reservation(self, info: ResolveInfo):
        reservation = Reservation.objects.filter(pk=self.pk).first()
        return reservation


class ReservationConfirmMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationPermission,)
    order = graphene.Field(PaymentOrderType)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationConfirmSerializer

    def resolve_order(self, info):
        payment_order = PaymentOrder.objects.filter(reservation__pk=self.pk).first()
        return payment_order


class ReservationCancellationMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationCancellationSerializer


class ReservationDenyMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationHandlingPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationDenySerializer


class ReservationApproveMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationHandlingPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationApproveSerializer


class ReservationRequiresHandlingMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationHandlingPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationRequiresHandlingSerializer


class ReservationWorkingMemoMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationCommentPermission,)

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationWorkingMemoSerializer


class ReservationAdjustTimeMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationAdjustTimeSerializer


class ReservationDeleteMutation(AuthDeleteMutation, ClientIDMutation):
    permission_classes = (ReservationPermission,)
    model = Reservation

    @classmethod
    def validate(self, root, info, **input):
        reservation = get_object_or_404(Reservation, pk=input.get("pk", None))
        if reservation.state not in (
            ReservationState.CREATED,
            ReservationState.WAITING_FOR_PAYMENT,
        ):
            raise ValidationError(
                "Reservation which is not in created or waiting_for_payment state cannot be deleted."
            )

        payment_order: PaymentOrder = reservation.payment_order.first()
        if payment_order and payment_order.remote_id:
            try:
                webshop_order = cancel_order(
                    payment_order.remote_id, payment_order.reservation_user_uuid
                )

                if webshop_order and webshop_order.status == "cancelled":
                    payment_order.status = OrderStatus.CANCELLED
                    payment_order.save()
            except CancelOrderError as err:
                capture_message(
                    f"Failed to cancel order {payment_order.remote_id}: {err}"
                )
                raise ValidationErrorWithCode(
                    "Unable to cancel the order: problem with external service",
                    ValidationErrorCodes.EXTERNAL_SERVICE_ERROR,
                )

        return None


class ReservationStaffCreateMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (ReservationStaffCreatePermission,)
    model = Reservation

    reservation = graphene.Field(ReservationType)

    class Meta:
        model_operations = ["create"]
        serializer_class = ReservationStaffCreateSerializer

    def resolve_reservation(self, info: ResolveInfo):
        reservation = Reservation.objects.filter(pk=self.pk).first()
        return reservation
