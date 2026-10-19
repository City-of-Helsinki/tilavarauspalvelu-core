from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

from tilavarauspalvelu.enums import BannerNotificationTarget
from tilavarauspalvelu.models.banner_notification.model import BannerNotification
from tilavarauspalvelu.typing import AnyUser

if TYPE_CHECKING:
    from query_optimizer.typing import GraphQLFilterInfo


__all__ = [
    "BannerNotificationPermission",
]


class BannerNotificationPermission(BasePermission[BannerNotification, AnyUser]):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_node_permission(cls, instance: BannerNotification, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        if user.permissions.can_manage_notifications():
            return True

        if not instance.is_active:
            return False

        if user.is_anonymous:
            return instance.target in BannerNotificationTarget.for_customers

        if not user.is_active:
            return False

        if user.permissions.has_any_role():
            return instance.target in BannerNotificationTarget.for_staff

        return instance.target in BannerNotificationTarget.for_customers

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_notifications()
