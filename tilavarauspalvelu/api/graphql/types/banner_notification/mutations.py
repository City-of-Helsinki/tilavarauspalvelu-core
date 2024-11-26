from __future__ import annotations

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.models.banner_notification.model import BannerNotification

from .permissions import BannerNotificationPermission
from .serializers import BannerNotificationSerializer

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
