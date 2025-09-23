from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import Space

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Resource
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "ResourcePermission",
]


class ResourcePermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_create_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        space = cls._get_space(input_data)
        return user.permissions.can_manage_resources(space)

    @classmethod
    def has_update_permission(cls, instance: Resource, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_resources(instance.space)

    @classmethod
    def has_delete_permission(cls, instance: Resource, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_resources(instance.space)

    @classmethod
    def _get_space(cls, input_data: dict[str, Any]) -> Space | None:
        space_pk = input_data.get("space")  # Space is not required for creating a Resource
        if space_pk is None:
            return None
        return Space.objects.filter(pk=space_pk).first()
