from graphene_django_extensions import UpdateMutation

from api.graphql.types.user.permissions import UserPermission
from api.graphql.types.user.serializers import UserUpdateSerializer


class UserUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = UserUpdateSerializer
        permission_classes = [UserPermission]
