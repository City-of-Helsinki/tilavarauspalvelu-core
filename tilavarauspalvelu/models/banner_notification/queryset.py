from typing import Self

from django.db import models

from tilavarauspalvelu.enums import BannerNotificationLevel, BannerNotificationTarget
from tilavarauspalvelu.typing import AnyUser
from utils.db import NowTT

__all__ = [
    "BANNER_LEVEL_SORT_ORDER",
    "BANNER_STATE_SORT_ORDER",
    "BANNER_TARGET_SORT_ORDER",
    "BannerNotificationManager",
    "BannerNotificationQuerySet",
]


class BannerNotificationQuerySet(models.QuerySet):
    def order_by_expression(self, alias: str, expression: models.Expression, *, desc: bool = False) -> Self:
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
        return self.order_by_expression(alias="__level", expression=BANNER_LEVEL_SORT_ORDER, desc=desc)

    def order_by_state(self, *, desc: bool = False) -> Self:
        return self.order_by_expression(alias="__state", expression=BANNER_STATE_SORT_ORDER, desc=desc)

    def order_by_target(self, *, desc: bool = False) -> Self:
        return self.order_by_expression(alias="__target", expression=BANNER_TARGET_SORT_ORDER, desc=desc)


class BannerNotificationManager(models.Manager.from_queryset(BannerNotificationQuerySet)): ...


BANNER_LEVEL_SORT_ORDER = models.Case(
    models.When(
        level=BannerNotificationLevel.EXCEPTION,
        then=models.Value(1),
    ),
    models.When(
        level=BannerNotificationLevel.WARNING,
        then=models.Value(2),
    ),
    models.When(
        level=BannerNotificationLevel.NORMAL,
        then=models.Value(3),
    ),
    default=models.Value(4),
)

# Can't use this for indexing because it uses the NowTT() function
BANNER_STATE_SORT_ORDER = models.Case(
    # Draft
    models.When(
        draft=True,
        then=models.Value(3),
    ),
    # Scheduled
    models.When(
        condition=(models.Q(active_from__gt=NowTT())),
        then=models.Value(2),
    ),
    # Active
    models.When(
        condition=(models.Q(active_from__lte=NowTT()) & models.Q(active_until__gte=NowTT())),
        then=models.Value(1),
    ),
    # "Past" / "draft"
    default=models.Value(4),
)

BANNER_TARGET_SORT_ORDER = models.Case(
    models.When(
        target=BannerNotificationTarget.ALL,
        then=models.Value(1),
    ),
    models.When(
        target=BannerNotificationTarget.USER,
        then=models.Value(2),
    ),
    models.When(
        target=BannerNotificationTarget.STAFF,
        then=models.Value(3),
    ),
    default=models.Value(4),
)
