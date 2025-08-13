import datetime
from typing import Any

from undine import GQLInfo, Input, MutationType
from undine.exceptions import GraphQLPermissionError

from tilavarauspalvelu.models import BannerNotification, User

from .validations import validate_banner_notification


class BannerNotificationUpdateMutation(MutationType[BannerNotification], kind="update"):
    pk = Input()
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
            msg = "No permission to update this banner notification."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __validate__(cls, instance: BannerNotification, info: GQLInfo[User], input_data: dict[str, Any]) -> None:
        message: str = input_data.get("message", instance.message)
        draft: bool = input_data.get("draft", instance.draft)
        active_from: datetime.datetime | None = input_data.get("active_from", instance.active_from)
        active_until: datetime.datetime | None = input_data.get("active_until", instance.active_until)

        validate_banner_notification(message, draft, active_from, active_until)
