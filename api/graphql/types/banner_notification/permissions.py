from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.enums import BannerNotificationTarget
from common.models import BannerNotification
from common.typing import AnyUser

__all__ = [
    "BannerNotificationPermission",
]


class BannerNotificationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_node_permission(cls, instance: BannerNotification, user: AnyUser, filters: dict[str, Any]) -> bool:
        if user.permissions.can_manage_notifications():
            return True

        if not instance.is_active:
            return False

        if user.is_anonymous:
            return instance.target in [BannerNotificationTarget.USER, BannerNotificationTarget.ALL]

        if not user.is_active:
            return False

        if user.permissions.has_any_role():
            return instance.target in [BannerNotificationTarget.STAFF, BannerNotificationTarget.ALL]

        return instance.target in [BannerNotificationTarget.USER, BannerNotificationTarget.ALL]

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return user.permissions.can_manage_notifications()
