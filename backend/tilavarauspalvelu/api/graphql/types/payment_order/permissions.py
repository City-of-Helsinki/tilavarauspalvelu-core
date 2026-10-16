from __future__ import annotations

from typing import TYPE_CHECKING, Any

from graphene_django_extensions.permissions import BasePermission

if TYPE_CHECKING:
    from query_optimizer.typing import GraphQLFilterInfo

    from tilavarauspalvelu.models import PaymentOrder
    from tilavarauspalvelu.typing import AnyUser


__all__ = [
    "PaymentOrderPermission",
]


class PaymentOrderPermission(BasePermission):
    @classmethod
    def has_permission(cls, user: AnyUser) -> bool:
        return user.is_authenticated

    @classmethod
    def has_node_permission(cls, instance: PaymentOrder, user: AnyUser, filters: GraphQLFilterInfo) -> bool:
        if not user.is_authenticated:
            return False

        reservation = instance.reservation
        if reservation is None:
            return False
        if reservation.user == user:
            return True
        return user.permissions.can_view_reservation(reservation)

    @classmethod
    def has_mutation_permission(cls, user: AnyUser, input_data: dict[str, Any]) -> bool:
        return False
