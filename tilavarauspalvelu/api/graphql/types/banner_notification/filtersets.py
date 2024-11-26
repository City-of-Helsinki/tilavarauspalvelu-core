from __future__ import annotations

from typing import TYPE_CHECKING

import django_filters
from graphene_django_extensions import ModelFilterSet

from tilavarauspalvelu.models.banner_notification.model import BannerNotification

if TYPE_CHECKING:
    from tilavarauspalvelu.models.banner_notification.queryset import BannerNotificationQuerySet

__all__ = [
    "BannerNotificationFilterSet",
]


class BannerNotificationFilterSet(ModelFilterSet):
    is_active = django_filters.BooleanFilter(method="filter_active")
    is_visible = django_filters.BooleanFilter(method="filter_visible")

    class Meta:
        model = BannerNotification
        fields = [
            "name",
            "target",
        ]
        order_by = [
            "pk",
            "name",
            ("active_from", "starts"),
            ("active_until", "ends"),
            "level",
            "state",
            "target",
        ]

    @staticmethod
    def filter_active(
        qs: BannerNotificationQuerySet,
        name: str,
        value: bool,
    ) -> BannerNotificationQuerySet:
        return qs.active() if value else qs.inactive()

    def filter_visible(
        self,
        qs: BannerNotificationQuerySet,
        name: str,
        value: bool,
    ) -> BannerNotificationQuerySet:
        return qs.visible(self.request.user) if value else qs.hidden(self.request.user)

    @staticmethod
    def order_by_level(qs: BannerNotificationQuerySet, *, desc: bool) -> BannerNotificationQuerySet:
        return qs.order_by_level(desc=desc)

    @staticmethod
    def order_by_target(qs: BannerNotificationQuerySet, *, desc: bool) -> BannerNotificationQuerySet:
        return qs.order_by_target(desc=desc)

    @staticmethod
    def order_by_state(qs: BannerNotificationQuerySet, *, desc: bool) -> BannerNotificationQuerySet:
        return qs.order_by_state(desc=desc)
