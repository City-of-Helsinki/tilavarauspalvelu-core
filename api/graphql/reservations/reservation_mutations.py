import graphene
from graphene import ResolveInfo
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.permissions import AllowAny

from api.graphql.base_mutations import AuthSerializerMutation
from api.graphql.reservations.reservation_serializers import (
    ReservationCancellationSerializer,
    ReservationConfirmSerializer,
    ReservationCreateSerializer,
    ReservationHandleSerializer,
    ReservationUpdateSerializer,
)
from api.graphql.reservations.reservation_types import ReservationType
from permissions.api_permissions.graphene_permissions import (
    ReservationHandlingPermission,
    ReservationPermission,
)
from reservations.models import Reservation
from tilavarauspalvelu import settings


class ReservationCreateMutation(AuthSerializerMutation, SerializerMutation):
    reservation = graphene.Field(ReservationType)

    permission_classes = (
        (ReservationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        model_operations = ["create"]
        serializer_class = ReservationCreateSerializer

    def resolve_reservation(self, info: ResolveInfo):
        reservation = Reservation.objects.filter(pk=self.pk).first()
        return reservation


class ReservationUpdateMutation(AuthSerializerMutation, SerializerMutation):
    reservation = graphene.Field(ReservationType)

    permission_classes = (
        (ReservationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationUpdateSerializer

    def resolve_reservation(self, info: ResolveInfo):
        reservation = Reservation.objects.filter(pk=self.pk).first()
        return reservation


class ReservationConfirmMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (
        (ReservationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationConfirmSerializer


class ReservationCancellationMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (
        (ReservationPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationCancellationSerializer


class ReservationHandleMutation(AuthSerializerMutation, SerializerMutation):
    permission_classes = (
        (ReservationHandlingPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        lookup_field = "pk"
        serializer_class = ReservationHandleSerializer
