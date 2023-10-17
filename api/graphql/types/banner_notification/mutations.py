from api.graphql.extensions.base_mutations import CreateAuthMutation, DeleteAuthMutation, UpdateAuthMutation
from api.graphql.types.banner_notification.permissions import BannerNotificationPermission
from api.graphql.types.banner_notification.serializers import BannerNotificationSerializer
from common.models import BannerNotification

__all__ = [
    "BannerNotificationCreateMutation",
    "BannerNotificationUpdateMutation",
    "BannerNotificationDeleteMutation",
]


class BannerNotificationCreateMutation(CreateAuthMutation):
    class Meta:
        serializer_class = BannerNotificationSerializer
        permission_classes = (BannerNotificationPermission,)


class BannerNotificationUpdateMutation(UpdateAuthMutation):
    class Meta:
        serializer_class = BannerNotificationSerializer
        permission_classes = (BannerNotificationPermission,)


class BannerNotificationDeleteMutation(DeleteAuthMutation):
    class Meta:
        model = BannerNotification
        permission_classes = (BannerNotificationPermission,)
