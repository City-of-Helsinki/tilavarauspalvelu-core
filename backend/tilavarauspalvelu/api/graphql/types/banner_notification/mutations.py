from __future__ import annotations

from graphene_django_extensions import CreateMutation, DeleteMutation, UpdateMutation

from tilavarauspalvelu.models.banner_notification.model import BannerNotification
from tilavarauspalvelu.typing import AnyUser

from .permissions import BannerNotificationPermission
from .serializers import BannerNotificationSerializer

__all__ = [
    "BannerNotificationCreateMutation",
    "BannerNotificationDeleteMutation",
    "BannerNotificationUpdateMutation",
]


class BannerNotificationCreateMutation(CreateMutation[BannerNotification, AnyUser]):
    class Meta:
        serializer_class = BannerNotificationSerializer
        permission_classes = [BannerNotificationPermission]


class BannerNotificationUpdateMutation(UpdateMutation[BannerNotification, AnyUser]):
    class Meta:
        serializer_class = BannerNotificationSerializer
        permission_classes = [BannerNotificationPermission]


class BannerNotificationDeleteMutation(DeleteMutation[BannerNotification, AnyUser]):
    class Meta:
        model = BannerNotification
        permission_classes = [BannerNotificationPermission]
