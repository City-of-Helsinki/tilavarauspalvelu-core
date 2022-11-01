import graphene
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.base_mutations import AuthSerializerMutation
from api.graphql.units.unit_serializers import UnitUpdateSerializer
from api.graphql.units.unit_types import UnitType
from permissions.api_permissions.graphene_permissions import UnitPermission


class UnitUpdateMutation(AuthSerializerMutation, SerializerMutation):
    unit = graphene.Field(UnitType)

    permission_classes = (UnitPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = UnitUpdateSerializer
