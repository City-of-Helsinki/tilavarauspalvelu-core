from graphene_django_extensions import UpdateMutation

from .permissions import UserPermission, UserStaffPermission
from .serializers import UserStaffUpdateSerializer, UserUpdateSerializer

__all__ = [
    "UserStaffUpdateMutation",
    "UserUpdateMutation",
]


class UserUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = UserUpdateSerializer
        permission_classes = [UserPermission]


class UserStaffUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = UserStaffUpdateSerializer
        permission_classes = [UserStaffPermission]
