from typing import Self

from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from django.db import models
from django.db.models.functions import Now

from common.choices import BannerNotificationTarget, BannerNotificationType
from permissions.helpers import can_manage_banner_notifications

from ._base import BaseQuerySet

User = get_user_model()


class BannerNotificationQuerySet(BaseQuerySet):
    def active(self) -> Self:
        return self.filter(
            draft=False,
            active_from__lte=Now(),
            active_until__gte=Now(),
        )

    def visible(self, user: User | AnonymousUser) -> Self:
        if user.is_anonymous:
            return self.active().filter(
                models.Q(target=BannerNotificationTarget.USER) | models.Q(target=BannerNotificationTarget.ALL),
            )

        if can_manage_banner_notifications(user):
            return self.active()

        if user.has_staff_permissions:
            return self.active().filter(
                models.Q(target=BannerNotificationTarget.STAFF) | models.Q(target=BannerNotificationTarget.ALL),
            )

        return self.active().filter(
            models.Q(target=BannerNotificationTarget.USER) | models.Q(target=BannerNotificationTarget.ALL),
        )

    def hidden(self, user: User | AnonymousUser) -> Self:
        if user.is_anonymous:
            return self.none()

        if can_manage_banner_notifications(user):
            return self.filter(draft=True)

        return self.none()

    def order_by_type(self, desc: bool = False) -> Self:
        return self.order_by_expression(alias="__type", expression=BANNER_TYPE_SORT_ORDER, desc=desc)

    def order_by_state(self, desc: bool = False) -> Self:
        return self.order_by_expression(alias="__state", expression=BANNER_STATE_SORT_ORDER, desc=desc)

    def order_by_target(self, desc: bool = False) -> Self:
        return self.order_by_expression(alias="__target", expression=BANNER_TARGET_SORT_ORDER, desc=desc)


BANNER_TYPE_SORT_ORDER = models.Case(
    models.When(
        type=BannerNotificationType.EXCEPTION,
        then=models.Value(1),
    ),
    models.When(
        type=BannerNotificationType.WARNING,
        then=models.Value(2),
    ),
    models.When(
        type=BannerNotificationType.NORMAL,
        then=models.Value(3),
    ),
    default=models.Value(4),
)

# Can't use this for indexing because it uses the Now() function
BANNER_STATE_SORT_ORDER = models.Case(
    # Draft
    models.When(
        draft=True,
        then=models.Value(3),
    ),
    # Scheduled
    models.When(
        condition=(models.Q(active_from__gt=Now())),
        then=models.Value(2),
    ),
    # Active
    models.When(
        condition=(models.Q(active_from__lte=Now()) & models.Q(active_until__gte=Now())),
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
