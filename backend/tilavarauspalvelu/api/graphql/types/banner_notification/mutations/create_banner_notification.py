import datetime
from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import BannerNotification, User

from .validations import validate_banner_notification


class BannerNotificationCreateMutation(MutationType[BannerNotification], kind="create"):
    name = Input()
    message_fi = Input()
    message_sv = Input()
    message_en = Input()
    draft = Input()
    level = Input()
    target = Input()
    active_from = Input()
    active_until = Input()

    @classmethod
    def __permissions__(cls, instance: BannerNotification, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        user = info.context.user
        if not user.permissions.can_manage_notifications():
            msg = "No permission to create banner notifications."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: BannerNotification, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        message: str = input_data.get("message_fi", "")
        draft: bool = input_data.get("draft", False)
        active_from: datetime.datetime | None = input_data.get("active_from")
        active_until: datetime.datetime | None = input_data.get("active_until")

        validate_banner_notification(message, draft, active_from, active_until)
