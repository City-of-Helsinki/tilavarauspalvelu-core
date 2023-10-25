import graphene

from api.graphql.extensions.base_types import DjangoAuthNode
from api.graphql.extensions.permission_helpers import private_field
from api.graphql.types.banner_notification.filtersets import BannerNotificationFilterSet
from api.graphql.types.banner_notification.permissions import BannerNotificationPermission
from common.choices import BannerNotificationState
from common.models import BannerNotification
from common.typing import GQLInfo
from permissions.helpers import can_manage_banner_notifications


class BannerNotificationNode(DjangoAuthNode):
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
        private_fields = {
            "name": can_manage_banner_notifications,
            "draft": can_manage_banner_notifications,
            "target": can_manage_banner_notifications,
        }
        filterset_class = BannerNotificationFilterSet
        permission_classes = (BannerNotificationPermission,)

    @private_field(can_manage_banner_notifications)
    def resolve_state(self: BannerNotification, info: GQLInfo) -> BannerNotificationState:
        return self.state
