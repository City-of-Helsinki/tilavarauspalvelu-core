import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.banner_notification.filtersets import BannerNotificationFilterSet
from api.graphql.banner_notification.permissions import BannerNotificationPermission
from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from common.choices import BannerNotificationState
from common.models import BannerNotification
from common.typing import GQLInfo
from permissions.api_permissions.graphene_field_decorators import private_field
from permissions.helpers import can_manage_banner_notifications


class BannerNotificationType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (BannerNotificationPermission,)

    state = graphene.Field(graphene.Enum.from_enum(BannerNotificationState))

    class Meta:
        model = BannerNotification
        fields = [
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
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection
        filterset_class = BannerNotificationFilterSet

    @private_field(can_manage_banner_notifications)
    def resolve_name(self: BannerNotification, info: GQLInfo) -> str:
        return self.name

    @private_field(can_manage_banner_notifications)
    def resolve_draft(self: BannerNotification, info: GQLInfo) -> bool:
        return self.draft

    @private_field(can_manage_banner_notifications)
    def resolve_target(self: BannerNotification, info: GQLInfo) -> str:
        return self.target

    @private_field(can_manage_banner_notifications)
    def resolve_state(self: BannerNotification, info: GQLInfo) -> BannerNotificationState:
        return self.state
