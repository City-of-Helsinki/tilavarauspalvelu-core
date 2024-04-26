from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from permissions.helpers import can_manage_resources
from resources.models import Resource
from spaces.models import Space

__all__ = [
    "ResourcePermission",
]


class ResourcePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        space_pk: int | None = input_data.get("space")  # Space is not required for creating a Resource
        space = None if space_pk is None else Space.objects.filter(pk=space_pk).first()
        return can_manage_resources(user, space)

    @classmethod
    def has_update_permission(cls, instance: Resource, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_resources(user, instance.space)

    @classmethod
    def has_delete_permission(cls, instance: Resource, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_resources(user, instance.space)
