from lookup_property import L
from undine import Order, OrderSet

from tilavarauspalvelu.models import BannerNotification

__all__ = [
    "BannerNotificationOrderSet",
]


class BannerNotificationOrderSet(OrderSet[BannerNotification]):
    pk = Order()
    name = Order()
    starts = Order("active_from")
    ends = Order("active_until")

    level = Order(L("banner_level_sort_order"))
    target = Order(L("banner_target_sort_order"))
    state = Order(L("banner_state_sort_order"))
