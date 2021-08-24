import graphene
from django.conf import settings
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.mixins import AuthMutation
from graphene_permissions.permissions import AllowAny
from rest_framework.generics import get_object_or_404

from api.graphql.base_mutations import AuthSerializerMutation
from api.graphql.reservation_units.reservation_unit_serializers import (
    PurposeCreateSerializer,
    PurposeUpdateSerializer,
    ReservationUnitCreateSerializer,
    ReservationUnitUpdateSerializer,
)
from api.graphql.reservation_units.reservation_unit_types import (
    PurposeType,
    ReservationUnitType,
)
from permissions.api_permissions.graphene_permissions import (
    PurposePermission,
    ReservationUnitPermission,
)
from reservation_units.models import Purpose


class PurposeCreateMutation(SerializerMutation, AuthMutation):
    purpose = graphene.Field(PurposeType)

    permission_classes = (
        (PurposePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model_operations = ["create"]

        serializer_class = PurposeCreateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        purpose = serializer.create(serializer.validated_data)
        return cls(errors=None, purpose=purpose)


class PurposeUpdateMutation(SerializerMutation, AuthMutation):
    purpose = graphene.Field(PurposeType)

    permission_classes = (
        (PurposePermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = PurposeUpdateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):

        validated_data = serializer.validated_data
        pk = validated_data.get("pk")
        purpose = serializer.update(get_object_or_404(Purpose, pk=pk), validated_data)
        return cls(errors=None, purpose=purpose)


class ReservationUnitCreateMutation(AuthSerializerMutation, SerializerMutation):
    reservation_unit = graphene.Field(ReservationUnitType)

    permission_classes = (
        (ReservationUnitPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        model_operations = ["create"]

        serializer_class = ReservationUnitCreateSerializer


class ReservationUnitUpdateMutation(AuthSerializerMutation, SerializerMutation):
    reservation_unit = graphene.Field(ReservationUnitType)

    permission_classes = (
        (ReservationUnitPermission,)
        if not settings.TMP_PERMISSIONS_DISABLED
        else (AllowAny,)
    )

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = ReservationUnitUpdateSerializer
