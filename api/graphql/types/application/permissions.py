from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

from common.typing import AnyUser
from permissions.helpers import can_modify_application, can_read_application

if TYPE_CHECKING:
    from applications.models import Application


class ApplicationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: Application, user: AnyUser, filters: dict[str, Any]) -> bool:
        return can_read_application(user, instance)

    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_modify_application(user, instance)
