import datetime

from django.db import models
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

    @expires_in_minutes.optimize
    def optimize_expires_in_minutes(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("status")
        data.only_fields.add("created_at")

    @Field
    def checkout_url(root: PaymentOrder, info: GQLInfo[User]) -> str | None:
        if root.status not in OrderStatus.can_start_payment_statuses:
            return None

        if root.expires_at.astimezone(DEFAULT_TIMEZONE) <= local_datetime():
            return None

        return root.checkout_url or None

    @checkout_url.optimize
    def optimize_checkout_url(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("status")
        data.only_fields.add("created_at")
        data.only_fields.add("checkout_url")

    @Field
    def receipt_url(root: PaymentOrder, info: GQLInfo[User]) -> str | None:
        return root.receipt_url or None

    @receipt_url.optimize
    def optimize_receipt_url(self, data: OptimizationData, info: GQLInfo[User]) -> None:
        data.only_fields.add("receipt_url")

    @classmethod
    def __permissions__(cls, instance: PaymentOrder, info: GQLInfo[User]) -> None:
        if instance.reservation is None:
            msg = "PaymentOrder not connected to a reservation."
            raise GraphQLPermissionError(msg)

        user = info.context.user
        if instance.reservation.user == user:
            return

        if not user.permissions.can_view_reservation(instance.reservation):
            msg = "No permission to access this payment order."
            raise GraphQLPermissionError(msg)

    @classmethod
    def __optimizations__(cls, data: OptimizationData, info: GQLInfo) -> None:
        reservation_data = data.add_select_related("reservation")

        # See 'tilavarauspalvelu.models.reservation.queryset.ReservationQuerySet.with_permissions'
        reservation_data.aliases["FETCH_UNITS_FOR_PERMISSIONS_FLAG"] = models.Value("")

        reservation_data.add_select_related("user")
