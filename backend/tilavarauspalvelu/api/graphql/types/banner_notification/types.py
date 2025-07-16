from __future__ import annotations

from typing import TYPE_CHECKING

from undine import QueryType
from undine.utils.graphql.utils import get_arguments

from tilavarauspalvelu.enums import BannerNotificationState
from tilavarauspalvelu.models.banner_notification.model import BannerNotification

from .filtersets import BannerNotificationFilterSet
from .permissions import BannerNotificationPermission

if TYPE_CHECKING:
    from tilavarauspalvelu.models.banner_notification.queryset import BannerNotificationQuerySet
    from tilavarauspalvelu.typing import GQLInfo

__all__ = [
    "BannerNotificationNode",
]


class BannerNotificationNode(QueryType[BannerNotification]):
    state = graphene.Field(graphene.Enum.from_enum(BannerNotificationState), required=True)

    class Meta:
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

    @classmethod
    def __get_queryset__(cls, info: GQLInfo) -> BannerNotificationQuerySet:
        user = info.context.user
        if user.permissions.can_manage_notifications():
            return BannerNotification.objects.all()

        args = get_arguments(info)
        visible = args.get("input", {}).get("is_visible", False)
        if visible:
            return BannerNotification.objects.all().visible(info.context.user)

        return BannerNotification.objects.all().none()

    @restricted_field(lambda user: user.permissions.can_manage_notifications())
    def resolve_state(root: BannerNotification, info: GQLInfo) -> BannerNotificationState:
        return root.state
