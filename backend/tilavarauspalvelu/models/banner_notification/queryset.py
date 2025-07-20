from __future__ import annotations

from typing import TYPE_CHECKING, Self

from django.db import models
from lookup_property import L

from tilavarauspalvelu.enums import BannerNotificationTarget
from tilavarauspalvelu.models import BannerNotification
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.db import NowTT

if TYPE_CHECKING:
    from undine import DjangoExpression

    from tilavarauspalvelu.typing import AnyUser

__all__ = [
    "BannerNotificationManager",
    "BannerNotificationQuerySet",
]


class BannerNotificationQuerySet(ModelQuerySet[BannerNotification]):
    def order_by_expression(self, alias: str, expression: DjangoExpression, *, desc: bool = False) -> Self:
        order_by = models.OrderBy(models.F(alias), descending=desc)
        return self.alias(**{alias: expression}).order_by(order_by)

    def active(self) -> Self:
        return self.filter(
            draft=False,
            active_from__lte=NowTT(),
            active_until__gte=NowTT(),
        )

    def inactive(self) -> Self:
        return self.filter(
            draft=True,
            active_from__isnull=True,
            active_until__isnull=True,
        )

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
        return self.order_by_expression(alias="__level", expression=L("banner_level_sort_order"), desc=desc)

    def order_by_state(self, *, desc: bool = False) -> Self:
        return self.order_by_expression(alias="__state", expression=L("banner_state_sort_order"), desc=desc)

    def order_by_target(self, *, desc: bool = False) -> Self:
        return self.order_by_expression(alias="__target", expression=L("banner_target_sort_order"), desc=desc)


class BannerNotificationManager(ModelManager[BannerNotification, BannerNotificationQuerySet]): ...
