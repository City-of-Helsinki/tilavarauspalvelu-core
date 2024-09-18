from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser


class ApplicationRoundTimeSlotPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True
