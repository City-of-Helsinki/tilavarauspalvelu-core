from typing import Any

from graphene_permissions.permissions import BasePermission

from common.models import BannerNotification
from common.typing import GQLInfo
from permissions.helpers import can_manage_banner_notifications


class BannerNotificationPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return True

    @classmethod
    def has_node_permission(cls, info: GQLInfo, id: str) -> bool:
        can_see_all = can_manage_banner_notifications(info.context.user)
        if can_see_all:
            return True

        return BannerNotification.objects.visible(info.context.user).filter(pk=id).exists()

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return can_manage_banner_notifications(info.context.user)
