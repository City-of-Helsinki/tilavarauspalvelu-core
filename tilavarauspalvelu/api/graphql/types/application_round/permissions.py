from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

if TYPE_CHECKING:
    from tilavarauspalvelu.models import ApplicationRound
    from tilavarauspalvelu.typing import AnyUser


class ApplicationRoundPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False

    @classmethod
    def has_update_permission(cls, instance: ApplicationRound, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_application_round(instance)
