import graphene
from django.conf import settings
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.permissions import AllowAny

from api.graphql.base_mutations import AuthSerializerMutation
from api.graphql.units.unit_serializers import UnitUpdateSerializer
from api.graphql.units.unit_types import UnitType
from permissions.api_permissions.graphene_permissions import UnitPermission


class UnitUpdateMutation(AuthSerializerMutation, SerializerMutation):
    unit = graphene.Field(UnitType)

    permission_classes = (
        (UnitPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = UnitUpdateSerializer
