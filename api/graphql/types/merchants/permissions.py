from typing import Any
from uuid import UUID

from graphene_django_extensions.permissions import BasePermission
from graphene_django_extensions.typing import GraphQLFilterInfo

from common.typing import AnyUser
from merchants.models import PaymentOrder
from permissions.helpers import can_handle_reservation, can_refresh_order

__all__ = [
    "OrderRefreshPermission",
    "PaymentOrderPermission",
]


class OrderRefreshPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        remote_id: UUID | None = input_data.get("order_uuid")
        if remote_id is None:
            return False
        payment_order = PaymentOrder.objects.filter(remote_id=remote_id).first()
        return can_refresh_order(user, payment_order)


class PaymentOrderPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: PaymentOrder, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        if not user.is_authenticated:
            return False

        return (
            instance.reservation.user.id == user.id  #
            or can_handle_reservation(user, instance.reservation)
        )

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False
