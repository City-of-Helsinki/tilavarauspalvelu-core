import graphene
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.permissions import AllowAny
from graphql import ResolveInfo

from api.graphql.base_mutations import AuthSerializerMutation
from api.graphql.reservations.reservation_serializers import (
    ReservationCreateSerializer,
    ReservationUpdateSerializer,
)
from api.graphql.reservations.reservation_types import ReservationType
from permissions.api_permissions.graphene_permissions import ReservationPermission
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
