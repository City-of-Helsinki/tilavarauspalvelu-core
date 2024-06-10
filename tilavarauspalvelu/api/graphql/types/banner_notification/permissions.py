from typing import Any

from graphene_django_extensions.permissions import BasePermission

from common.enums import BannerNotificationTarget
from common.models import BannerNotification
from common.typing import AnyUser
from permissions.helpers import can_manage_banner_notifications

__all__ = [
    "BannerNotificationPermission",
]


class BannerNotificationPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return True

    @classmethod
    def has_node_permission(cls, instance: BannerNotification, user: AnyUser, filters: dict[str, Any]) -> bool:
        can_see_all = can_manage_banner_notifications(user)
        if can_see_all:
            return True

        if not instance.is_active:
            return False

        if user.is_anonymous:
            return instance.target in [BannerNotificationTarget.USER, BannerNotificationTarget.ALL]

        if user.has_staff_permissions:
            return instance.target in [BannerNotificationTarget.STAFF, BannerNotificationTarget.ALL]

        return instance.target in [BannerNotificationTarget.USER, BannerNotificationTarget.ALL]

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return can_manage_banner_notifications(user)
