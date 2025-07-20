from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
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
        if user.is_anonymous:
            return self.active().filter(
                models.Q(target=BannerNotificationTarget.USER) | models.Q(target=BannerNotificationTarget.ALL),
            )

        if user.permissions.can_manage_notifications():
            return self.active()

        if user.permissions.has_any_role():
            return self.active().filter(
                models.Q(target=BannerNotificationTarget.STAFF) | models.Q(target=BannerNotificationTarget.ALL),
            )

        return self.active().filter(
            models.Q(target=BannerNotificationTarget.USER) | models.Q(target=BannerNotificationTarget.ALL),
        )

    def hidden(self, user: AnyUser) -> Self:
        if user.is_anonymous:
            return self.none()

        if user.permissions.can_manage_notifications():
            return self.inactive()

        return self.none()

    def order_by_level(self, *, desc: bool = False) -> Self:
        return self.order_by(L("banner_level_sort_order").order_by(descending=desc))

    def order_by_state(self, *, desc: bool = False) -> Self:
        return self.order_by(L("banner_state_sort_order").order_by(descending=desc))

    def order_by_target(self, *, desc: bool = False) -> Self:
        return self.order_by(L("banner_target_sort_order").order_by(descending=desc))


class BannerNotificationManager(ModelManager[BannerNotification, BannerNotificationQuerySet]): ...
