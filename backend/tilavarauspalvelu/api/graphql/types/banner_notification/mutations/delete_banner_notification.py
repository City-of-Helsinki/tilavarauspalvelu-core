from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import BannerNotification, User

__all__ = [
    "BannerNotificationDeleteMutation",
]


class BannerNotificationDeleteMutation(MutationType[BannerNotification], kind="delete"):
    pk = Input()

    @classmethod
    def __permissions__(cls, instance: BannerNotification, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_notifications():
            msg = "No permission to delete this banner notification."
            raise GraphQLPermissionError(msg)
