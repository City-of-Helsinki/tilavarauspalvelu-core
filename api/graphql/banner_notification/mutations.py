from api.graphql.base_mutations import CreateAuthMutation, DeleteAuthMutation, UpdateAuthMutation
from common.models import BannerNotification

from .permissions import BannerNotificationPermission
from .serializers import BannerNotificationSerializer

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
