from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

if TYPE_CHECKING:
    from tilavarauspalvelu.models import Application
    from tilavarauspalvelu.typing import AnyUser


class ApplicationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: Application, user: AnyUser, filters: dict[str, Any]) -> bool:
        return user.permissions.can_view_application(instance)

    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_application(instance)


class UpdateAllApplicationOptionsPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_application(instance, reserver_needs_role=True, all_units=True)
