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
    def active(self) -> Self:
        return self.filter(L(is_active=True))

    def inactive(self) -> Self:
        return self.filter(L(is_active=False))

    def visible(self, user: AnyUser) -> Self:
        if user.permissions.can_manage_notifications():
            return self.active()

        if user.permissions.has_any_role():
            return self.active().filter(target__in=BannerNotificationTarget.for_staff)

        return self.active().filter(target=BannerNotificationTarget.for_customers)


class BannerNotificationManager(ModelManager[BannerNotification, BannerNotificationQuerySet]): ...
