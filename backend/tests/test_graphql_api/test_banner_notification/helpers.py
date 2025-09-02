from __future__ import annotations

from enum import Enum, auto
from functools import partial
from typing import TYPE_CHECKING, Any, NamedTuple

from tests.query_builder import build_mutation, build_query

if TYPE_CHECKING:
    from tilavarauspalvelu.enums import BannerNotificationTarget

banner_notifications_query = partial(build_query, "bannerNotifications", connection=True, order_by="pkAsc")

CREATE_MUTATION = build_mutation(
    "createBannerNotification",
    "BannerNotificationCreateMutation",
)
UPDATE_MUTATION = build_mutation(
    "updateBannerNotification",
    "BannerNotificationUpdateMutation",
)
DELETE_MUTATION = build_mutation(
    "deleteBannerNotification",
    "BannerNotificationDeleteMutation",
)


class UserType(Enum):
    ANONYMOUS = auto()
    REGULAR = auto()
    STAFF = auto()
    SUPERUSER = auto()
    NOTIFICATION_MANAGER = auto()


class UserTypeParams(NamedTuple):
    user_type: UserType
    expected: Any


class TargetParams(NamedTuple):
    target: BannerNotificationTarget
    user_type: UserType
    expected: Any


class FieldParams(NamedTuple):
    field: str
    user_type: UserType
    expected: Any
