from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

if TYPE_CHECKING:
    from tilavarauspalvelu.models import PricingGroup
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "PricingGroupPermission",
]


class PricingGroupPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_update_permission(cls, instance: PricingGroup, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_pricing_group(instance)
