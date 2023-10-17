import graphene
from graphene_django.rest_framework.mutation import SerializerMutation

from api.graphql.extensions.legacy_helpers import OldAuthSerializerMutation
from api.graphql.types.users.permissions import UserPermission
from api.graphql.types.users.serializers import UserUpdateSerializer
from api.graphql.types.users.types import UserType


class UserUpdateMutation(OldAuthSerializerMutation, SerializerMutation):
    user = graphene.Field(UserType)

    permission_classes = (UserPermission,)

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = UserUpdateSerializer
