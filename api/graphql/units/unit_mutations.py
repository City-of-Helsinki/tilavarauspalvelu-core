import graphene
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.mixins import AuthMutation
from rest_framework.generics import get_object_or_404

from api.graphql.units.unit_serializers import UnitUpdateSerializer
from api.graphql.units.unit_types import UnitType
from permissions.api_permissions.graphene_permissions import UnitPermission
from spaces.models import Unit


class UnitUpdateMutation(SerializerMutation, AuthMutation):
    unit = graphene.Field(UnitType)

    permission_classes = (UnitPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = UnitUpdateSerializer

    @classmethod
    def perform_mutate(cls, serializer, info):
        validated_data = serializer.validated_data
        pk = validated_data.get("pk")
        unit = serializer.update(get_object_or_404(Unit, pk=pk), validated_data)
        return cls(errors=None, unit=unit)
