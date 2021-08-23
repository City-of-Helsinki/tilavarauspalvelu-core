import graphene
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.mixins import AuthMutation
from rest_framework.generics import get_object_or_404

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
from reservation_units.models import Purpose, ReservationUnit


class PurposeCreateMutation(SerializerMutation, AuthMutation):
    purpose = graphene.Field(PurposeType)

    permission_classes = (PurposePermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = PurposeCreateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        purpose = serializer.create(serializer.validated_data)
        return cls(errors=None, purpose=purpose)


class PurposeUpdateMutation(SerializerMutation, AuthMutation):
    purpose = graphene.Field(PurposeType)

    permission_classes = (PurposePermission,)

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


class ReservationUnitCreateMutation(SerializerMutation, AuthMutation):
    reservation_unit = graphene.Field(ReservationUnitType)

    permission_classes = (ReservationUnitPermission,)

    class Meta:
        model_operations = ["create"]

        serializer_class = ReservationUnitCreateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        reservation_unit = serializer.create(serializer.validated_data)
        return cls(errors=None, reservation_unit=reservation_unit)


class ReservationUnitUpdateMutation(SerializerMutation, AuthMutation):
    reservation_unit = graphene.Field(ReservationUnitType)

    permission_classes = (ReservationUnitPermission,)

    class Meta:
        model_operations = ["create"]
        lookup_field = "pk"
        serializer_class = ReservationUnitUpdateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        validated_data = serializer.validated_data
        pk = validated_data.get("pk")
        reservation_unit = serializer.update(
            get_object_or_404(ReservationUnit, pk=pk), validated_data
        )
        return cls(errors=None, reservation_unit=reservation_unit)
