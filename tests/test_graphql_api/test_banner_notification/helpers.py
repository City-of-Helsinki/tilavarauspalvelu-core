from functools import partial
from typing import Any, NamedTuple

from graphene_django_extensions.testing import build_mutation, build_query

from common.enums import BannerNotificationTarget
from tests.helpers import UserType

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
    fields="deleted",
)


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
