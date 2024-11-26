from __future__ import annotations

from typing import TYPE_CHECKING

import graphene
from graphene_django_extensions import DjangoNode
from graphene_django_extensions.permissions import restricted_field

from tilavarauspalvelu.enums import BannerNotificationState
from tilavarauspalvelu.models.banner_notification.model import BannerNotification

from .filtersets import BannerNotificationFilterSet
from .permissions import BannerNotificationPermission

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "BannerNotificationNode",
]


class BannerNotificationNode(DjangoNode):
    state = graphene.Field(graphene.Enum.from_enum(BannerNotificationState))

    class Meta:
        model = BannerNotification
        fields = [
            "pk",
            "name",
            "message",
            "message_fi",
            "message_en",
            "message_sv",
            "draft",
            "level",
            "target",
            "active_from",
            "active_until",
        ]
        restricted_fields = {
            "name": lambda user: user.permissions.can_manage_notifications(),
            "draft": lambda user: user.permissions.can_manage_notifications(),
            "target": lambda user: user.permissions.can_manage_notifications(),
        }
        filterset_class = BannerNotificationFilterSet
        permission_classes = [BannerNotificationPermission]

    @restricted_field(lambda user: user.permissions.can_manage_notifications())
    def resolve_state(root: BannerNotification, info: GQLInfo) -> BannerNotificationState:
        return root.state
