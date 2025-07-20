from __future__ import annotations

from typing import TYPE_CHECKING, Self

from lookup_property import L

from tilavarauspalvelu.enums import BannerNotificationTarget
from tilavarauspalvelu.models import BannerNotification
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

if TYPE_CHECKING:
    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "BannerNotificationManager",
    "BannerNotificationQuerySet",
]


class BannerNotificationQuerySet(ModelQuerySet[BannerNotification]):
    def visible(self, user: AnyUser) -> Self:
        qs = self.filter(L(is_active=True))

        if user.is_anonymous:
            return qs.filter(target__in=BannerNotificationTarget.for_customers)

        if user.permissions.can_manage_notifications():
            return qs

        if user.permissions.has_any_role():
            return qs.filter(target__in=BannerNotificationTarget.for_staff)

        return qs.filter(target__in=BannerNotificationTarget.for_customers)


class BannerNotificationManager(ModelManager[BannerNotification, BannerNotificationQuerySet]): ...
