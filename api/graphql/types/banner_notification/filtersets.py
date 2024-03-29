import django_filters

from api.graphql.extensions.order_filter import CustomOrderingFilter
from common.models import BannerNotification
from common.querysets.banner_notification import BannerNotificationQuerySet


class BannerNotificationFilterSet(django_filters.FilterSet):
    is_active = django_filters.BooleanFilter(method="filter_active")
    is_visible = django_filters.BooleanFilter(method="filter_visible")

    order_by = CustomOrderingFilter(
        fields=[
            "pk",
            "name",
            ("active_from", "starts"),
            ("active_until", "ends"),
            "level",
            "state",
            "target",
        ],
    )

    class Meta:
        model = BannerNotification
        fields = [
            "name",
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
    def order_by_level(qs: BannerNotificationQuerySet, desc: bool) -> BannerNotificationQuerySet:
        return qs.order_by_level(desc)

    @staticmethod
    def order_by_target(qs: BannerNotificationQuerySet, desc: bool) -> BannerNotificationQuerySet:
        return qs.order_by_target(desc)

    @staticmethod
    def order_by_state(qs: BannerNotificationQuerySet, desc: bool) -> BannerNotificationQuerySet:
        return qs.order_by_state(desc)
