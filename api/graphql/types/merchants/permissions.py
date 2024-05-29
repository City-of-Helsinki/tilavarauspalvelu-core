from typing import TYPE_CHECKING, Any

from graphene_django_extensions.errors import GQLCodeError
from graphene_django_extensions.permissions import BasePermission
from query_optimizer.typing import GraphQLFilterInfo

from api.graphql.extensions import error_codes
from common.typing import AnyUser
from merchants.models import PaymentOrder
from permissions.helpers import can_handle_reservation, can_refresh_order

if TYPE_CHECKING:
    import uuid

__all__ = [
    "OrderRefreshPermission",
    "PaymentOrderPermission",
]


class OrderRefreshPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        remote_id: uuid.UUID | None = input_data.get("order_uuid")
        if remote_id is None:
            msg = "Cannot refresh order without Order UUID."
            raise GQLCodeError(msg, code=error_codes.REQUIRED_FIELD_MISSING)

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
