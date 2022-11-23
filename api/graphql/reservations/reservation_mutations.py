import graphene
from django.core.exceptions import ValidationError
from graphene import ClientIDMutation, ResolveInfo
from graphene_django.rest_framework.mutation import SerializerMutation
from rest_framework.generics import get_object_or_404

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
    ReservationUpdateSerializer,
    ReservationWorkingMemoSerializer,
)
from api.graphql.reservations.reservation_types import ReservationType
from merchants.models import PaymentOrder
from permissions.api_permissions.graphene_permissions import (
    ReservationCommentPermission,
    ReservationHandlingPermission,
    ReservationPermission,
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

        return None
