from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from api.graphql.types.banner_notification.permissions import BannerNotificationPermissionNew
from api.graphql.types.banner_notification.serializers import BannerNotificationSerializer
from common.models import BannerNotification

__all__ = [
    "BannerNotificationCreateMutation",
    "BannerNotificationUpdateMutation",
    "BannerNotificationDeleteMutation",
]


class BannerNotificationCreateMutation(CreateMutation):
    class Meta:
        serializer_class = BannerNotificationSerializer
        permission_classes = [BannerNotificationPermissionNew]


class BannerNotificationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = BannerNotificationSerializer
        permission_classes = [BannerNotificationPermissionNew]


class BannerNotificationDeleteMutation(DeleteMutation):
    class Meta:
        model = BannerNotification
        permission_classes = [BannerNotificationPermissionNew]
