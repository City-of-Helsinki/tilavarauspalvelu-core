from graphene_django_extensions import UpdateMutation

from .permissions import UserPermission
from .serializers import UserUpdateSerializer


class UserUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = UserUpdateSerializer
        permission_classes = [UserPermission]
