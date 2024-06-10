from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser

__all__ = [
    "RejectedOccurrencePermission",
]


class RejectedOccurrencePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated
