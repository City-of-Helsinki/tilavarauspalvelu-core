from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from common.models import BannerNotification
from tilavarauspalvelu.api.graphql.types.banner_notification.permissions import BannerNotificationPermission
from tilavarauspalvelu.api.graphql.types.banner_notification.serializers import BannerNotificationSerializer

__all__ = [
    "BannerNotificationCreateMutation",
    "BannerNotificationDeleteMutation",
    "BannerNotificationUpdateMutation",
]


class BannerNotificationCreateMutation(CreateMutation):
    class Meta:
        serializer_class = BannerNotificationSerializer
        permission_classes = [BannerNotificationPermission]


class BannerNotificationUpdateMutation(UpdateMutation):
    class Meta:
        serializer_class = BannerNotificationSerializer
        permission_classes = [BannerNotificationPermission]


class BannerNotificationDeleteMutation(DeleteMutation):
    class Meta:
        model = BannerNotification
        permission_classes = [BannerNotificationPermission]
