from graphene_permissions.mixins import AuthFilter

from api.graphql.banner_notification.permissions import BannerNotificationPermission


class BannerNotificationConnection(AuthFilter):
    permission_classes = (BannerNotificationPermission,)
