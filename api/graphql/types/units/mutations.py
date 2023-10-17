import graphene
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.extensions.legacy_helpers import OldAuthSerializerMutation
from api.graphql.types.units.permissions import UnitPermission
from api.graphql.types.units.serializers import UnitUpdateSerializer
from api.graphql.types.units.types import UnitType


class UnitUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    unit = graphene.Field(UnitType)

    permission_classes = (UnitPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = UnitUpdateSerializer
