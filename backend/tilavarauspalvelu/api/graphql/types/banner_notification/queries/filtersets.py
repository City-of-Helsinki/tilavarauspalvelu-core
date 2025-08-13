from django.db import models
from lookup_property import L
from undine import Filter, FilterSet, GQLInfo
from undine.exceptions import EmptyFilterResult

from tilavarauspalvelu.enums import BannerNotificationTarget
from tilavarauspalvelu.models import User
from tilavarauspalvelu.models.banner_notification.model import BannerNotification

__all__ = [
    "BannerNotificationFilterSet",
]


class BannerNotificationFilterSet(FilterSet[BannerNotification]):
    name = Filter()
    target = Filter()
    is_active = Filter(L(is_active=True))

    @Filter
    def is_visible(self, info: GQLInfo[User], *, value: bool) -> models.Q:
        user = info.context.user

        if not value:
            if user.permissions.can_manage_notifications():
                return models.Q(L(is_active=False))

            raise EmptyFilterResult

        if user.permissions.can_manage_notifications():
            return models.Q(L(is_active=True))

        if user.permissions.has_any_role():
            return L(is_active=True) & models.Q(target__in=BannerNotificationTarget.for_staff)

        return L(is_active=True) & models.Q(target__in=BannerNotificationTarget.for_customers)
