import datetime

from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.optimizer import OptimizationData
from undine.relay import Node

from tilavarauspalvelu.enums import OrderStatus
from tilavarauspalvelu.models import PaymentOrder, User
from utils.date_utils import DEFAULT_TIMEZONE, local_datetime

__all__ = [
    "PaymentOrderNode",
]


class PaymentOrderNode(QueryType[PaymentOrder], interfaces=[Node]):
    order_uuid = Field("remote_id")
    refund_uuid = Field("refund_id")

    payment_type = Field()
    status = Field()

    processed_at = Field()
    created_at = Field()
    handled_payment_due_by = Field()

    reservation = Field()

    @Field
    def expires_in_minutes(root: PaymentOrder, info: GQLInfo[User]) -> int | None:
        if root.status not in OrderStatus.can_start_payment_statuses:
            return None

        time_left = root.expires_at.astimezone(DEFAULT_TIMEZONE) - local_datetime()

        if time_left <= datetime.timedelta():
            return None

        return int(time_left.total_seconds()) // 60

    @Field
    def checkout_url(root: PaymentOrder, info: GQLInfo[User]) -> str | None:
        if root.status not in OrderStatus.can_start_payment_statuses:
            return None

        if root.expires_at.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return None

        return root.checkout_url or None

    @Field
    def receipt_url(root: PaymentOrder, info: GQLInfo[User]) -> str | None:
        return root.receipt_url or None

    @expires_in_minutes.optimize
    def optimize_expires_in_minutes(self, info: GQLInfo[User], data: OptimizationData) -> None:
        data.only_fields |= {"status", "expires_at"}

    @checkout_url.optimize
    def optimize_checkout_url(self, info: GQLInfo[User], data: OptimizationData) -> None:
        data.only_fields |= {"checkout_url", "status", "expires_at"}

    @classmethod
    def __permissions__(cls, instance: PaymentOrder, info: GQLInfo[User]) -> None:
        if instance.reservation is None:
            msg = "PaymentOrder not connected to a reservation."
            raise GraphQLPermissionError(msg)

        user = info.context.user
        if instance.reservation.user == user:
            return

        if not user.permissions.can_view_reservation(instance.reservation):
            msg = "No permission to access this PaymentOrder."
            raise GraphQLPermissionError(msg)
