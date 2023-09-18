from api.graphql.banner_notification.permissions import BannerNotificationPermission
from api.graphql.banner_notification.serializers import BannerNotificationSerializer
from api.graphql.base_mutations import CreateAuthMutation, DeleteAuthMutation, UpdateAuthMutation
from common.models import BannerNotification

__all__ = [
    "BannerNotificationCreateMutation",
    "BannerNotificationUpdateMutation",
    "BannerNotificationDeleteMutation",
]


class BannerNotificationCreateMutation(CreateAuthMutation):
    permission_classes = (BannerNotificationPermission,)

    class Meta:
        serializer_class = BannerNotificationSerializer


class BannerNotificationUpdateMutation(UpdateAuthMutation):
    permission_classes = (BannerNotificationPermission,)

    class Meta:
        serializer_class = BannerNotificationSerializer
        lookup_field = "pk"


class BannerNotificationDeleteMutation(DeleteAuthMutation):
    permission_classes = (BannerNotificationPermission,)

    class Meta:
        model = BannerNotification
        lookup_field = "pk"
