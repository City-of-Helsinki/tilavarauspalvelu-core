from typing import Any

from lookup_property import L
from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.enums import BannerNotificationTarget
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

    state = Field(L("state"))

    @name.permissions
    @draft.permissions
    @target.permissions
    @state.permissions
    def field_permissions(root: BannerNotification, info: GQLInfo[User], value: Any) -> None:  # noqa: ARG002
        user = info.context.user
        if not user.permissions.can_manage_notifications():
            msg = "No permission to access field"
            raise GraphQLPermissionError(msg)

    @classmethod
    def __permissions__(cls, instance: BannerNotification, info: GQLInfo[User]) -> None:
        user = info.context.user
        if user.permissions.can_manage_notifications():
            return

        if not instance.is_active:
            msg = "No permission to view inactive banner notifications."
            raise GraphQLPermissionError(msg)

        if user.is_anonymous:
            if instance.target in BannerNotificationTarget.for_customers:
                return

            msg = "No permission to view banner notifications for regular users."
            raise GraphQLPermissionError(msg)

        if not user.is_active:
            msg = "Inactive users cannot view banner notifications."
            raise GraphQLPermissionError(msg)

        # Staff users can only see their notifications, not regular users'.
        if user.permissions.has_any_role():
            if instance.target in BannerNotificationTarget.for_staff:
                return

            msg = "No permission to view banner notifications for staff users."
            raise GraphQLPermissionError(msg)

        if instance.target not in BannerNotificationTarget.for_customers:
            msg = "No permission to view banner notifications for regular users."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __optimizations__(cls, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("target")
        data.annotations["is_active"] = L("is_active")

    @classmethod
    def __get_queryset__(cls, info: GQLInfo[User]) -> BannerNotificationQuerySet:
        user = info.context.user
        if user.permissions.can_manage_notifications():
            return BannerNotification.objects.all()
        return BannerNotification.objects.all().visible(info.context.user)
