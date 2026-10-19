from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import Application
from tilavarauspalvelu.typing import AnyUser

if TYPE_CHECKING:
    from query_optimizer.typing import GraphQLFilterInfo


class ApplicationPermission(BasePermission[Application, AnyUser]):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: Application, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        return user.permissions.can_view_application(instance)

    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_application(instance)


class ApplicationWorkingMemoPermission(BasePermission[Application, AnyUser]):
    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_view_application(instance, reserver_needs_role=True)


class UpdateAllApplicationOptionsPermission(BasePermission[Application, AnyUser]):
    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_application(instance, reserver_needs_role=True, all_units=True)
