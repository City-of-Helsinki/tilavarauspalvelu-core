import graphene
from graphene import ResolveInfo
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.base_mutations import AuthSerializerMutation
from api.graphql.merchants.merchant_types import PaymentOrderType
from api.graphql.reservations.reservation_serializers import (
    ReservationApproveSerializer,
    ReservationCancellationSerializer,
    ReservationConfirmSerializer,
    ReservationCreateSerializer,
    ReservationDenySerializer,
    ReservationRequiresHandlingSerializer,
    ReservationUnitAdjustTimeSerializer,
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
        serializer_class = ReservationUnitAdjustTimeSerializer
