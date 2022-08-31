import graphene
from django.conf import settings
from graphene_django.rest_framework.mutation import SerializerMutation
from graphene_permissions.permissions import AllowAny

from api.graphql.base_mutations import AuthSerializerMutation
from api.graphql.users.user_serializers import UserUpdateSerializer
from api.graphql.users.user_types import UserType
from permissions.api_permissions.graphene_permissions import UserPermission


class UserUpdateMutation(AuthSerializerMutation, SerializerMutation):
    user = graphene.Field(UserType)

    permission_classes = (
        (UserPermission,) if not settings.TMP_PERMISSIONS_DISABLED else (AllowAny,)
    )

    class Meta:
        model_operations = ["update"]
        lookup_field = "pk"
        serializer_class = UserUpdateSerializer
