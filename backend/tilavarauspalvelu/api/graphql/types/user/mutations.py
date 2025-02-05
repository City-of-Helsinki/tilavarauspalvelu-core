from __future__ import annotations

from typing import TYPE_CHECKING, Any, Self

from graphene_django_extensions import UpdateMutation
from graphene_django_extensions.bases import DjangoMutation

from .permissions import UserPermission, UserStaffPermission
from .serializers import CurrentUserUpdateSerializer, UserStaffUpdateSerializer

if TYPE_CHECKING:
    from tilavarauspalvelu.models import User
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "CurrentUserUpdateMutation",
    "UserStaffUpdateMutation",
]


class CurrentUserUpdateMutation(DjangoMutation):
    class Meta:
        serializer_class = CurrentUserUpdateSerializer
        permission_classes = [UserPermission]

    @classmethod
    def custom_mutation(cls, info: GQLInfo, input_data: dict[str, Any]) -> Self:
        user: User = info.context.user
        user.preferred_language = input_data["preferred_language"]
        user.save(update_fields=["preferred_language"])
        output = cls.get_serializer_output(user)
        return cls(**output)


class UserStaffUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = UserStaffUpdateSerializer
        permission_classes = [UserStaffPermission]
