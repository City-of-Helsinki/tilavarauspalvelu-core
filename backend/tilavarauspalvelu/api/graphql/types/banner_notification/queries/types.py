from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.relay import Node

from tilavarauspalvelu.enums import BannerNotificationState, BannerNotificationTarget
from tilavarauspalvelu.models import BannerNotification, User
from tilavarauspalvelu.models.banner_notification.queryset import BannerNotificationQuerySet

from .filtersets import BannerNotificationFilterSet
from .ordersets import BannerNotificationOrderSet

__all__ = [
    "BannerNotificationNode",
]


class BannerNotificationNode(
    QueryType[BannerNotification],
    filterset=BannerNotificationFilterSet,
    orderset=BannerNotificationOrderSet,
    interfaces=[Node],
):
    pk = Field()
    name = Field()

    message_fi = Field()
    message_en = Field()
    message_sv = Field()

    draft = Field()
    level = Field()
    target = Field()

    active_from = Field()
    active_until = Field()

    state = Field(L("notification_state"))

    @name.permissions
    def name_permissions(self, info: GQLInfo[User], value: str) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_manage_notifications():
            msg = "No permission to access banner notification name."
            raise GraphQLPermissionError(msg)

    @draft.permissions
    def draft_permissions(self, info: GQLInfo[User], value: bool) -> None:  # noqa: FBT001, ARG002
        user = info.context.user
        if not user.permissions.can_manage_notifications():
            msg = "No permission to access banner notification draft status."
            raise GraphQLPermissionError(msg)

    @target.permissions
    def target_permissions(self, info: GQLInfo[User], value: BannerNotificationTarget) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_manage_notifications():
            msg = "No permission to access banner notification target."
            raise GraphQLPermissionError(msg)

    @state.permissions
    def state_permissions(self, info: GQLInfo[User], value: BannerNotificationState) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_manage_notifications():
            msg = "No permission to access banner notification state."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __permissions__(cls, instance: BannerNotification, info: GQLInfo[User]) -> None:
        user = info.context.user

        if not user.is_active:
            msg = "Inactive users cannot view banner notifications."
            raise GraphQLPermissionError(msg)

        if user.permissions.can_manage_notifications():
            return

        if not instance.is_active:
            msg = "No permission to view inactive banner notifications."
            raise GraphQLPermissionError(msg)

        # Staff users can only see their notifications, not regular users'.
        if user.permissions.has_any_role():
            if instance.target not in BannerNotificationTarget.for_staff:
                msg = "No permission to view banner notifications for staff users."
                raise GraphQLPermissionError(msg)

        elif instance.target not in BannerNotificationTarget.for_customers:
            msg = "No permission to view banner notifications for regular users."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __get_queryset__(cls, info: GQLInfo[User]) -> BannerNotificationQuerySet:
        user = info.context.user
        if user.permissions.can_manage_notifications():
            return BannerNotification.objects.all()
        return BannerNotification.objects.all().visible(info.context.user)
