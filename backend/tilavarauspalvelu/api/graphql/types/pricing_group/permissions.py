from __future__ import annotations

from typing import Any

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.models import PricingGroup
from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "PricingGroupPermission",
]


class PricingGroupPermission(BasePermission[PricingGroup, AnyUser]):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_update_permission(cls, instance: PricingGroup, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_pricing_group(instance)
