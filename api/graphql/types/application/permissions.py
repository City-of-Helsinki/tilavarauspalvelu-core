from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

from permissions.helpers import (
    can_modify_application,
    can_read_application,
    has_general_permission,
    has_unit_permission,
)
from permissions.models import GeneralPermissionChoices, UnitPermissionChoices

if TYPE_CHECKING:
    from applications.models import Application
    from common.typing import AnyUser


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


class UpdateAllApplicationOptionsPermission(BasePermission):
    @classmethod
    def has_update_permission(cls, instance: Application, user: AnyUser, input_data: dict[str, Any]) -> bool:
        if user.is_anonymous:
            return False
        if user.is_superuser:
            return True

        if has_general_permission(user, GeneralPermissionChoices.CAN_HANDLE_APPLICATIONS):
            return True

        return all(
            has_unit_permission(user, UnitPermissionChoices.CAN_HANDLE_APPLICATIONS, [unit_id])
            for unit_id in instance.units.values_list("pk", flat=True)
        )
