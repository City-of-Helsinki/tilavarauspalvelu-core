from graphene_django_extensions import UpdateMutation

from .permissions import UserStaffPermission
from .serializers import UserStaffUpdateSerializer

__all__ = [
    "UserStaffUpdateMutation",
]


class UserStaffUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = UserStaffUpdateSerializer
        permission_classes = [UserStaffPermission]
