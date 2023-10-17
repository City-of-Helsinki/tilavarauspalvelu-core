from typing import Any

from graphene_permissions.permissions import BasePermission

from common.typing import GQLInfo
from merchants.models import PaymentOrder
from permissions.helpers import can_refresh_order


class OrderRefreshPermission(BasePermission):
    @classmethod
    def has_mutation_permission(cls, root, info, input):
        remote_id = input.get("order_uuid")
        payment_order = PaymentOrder.objects.filter(remote_id=remote_id).first()
        return can_refresh_order(info.context.user, payment_order)


class PaymentOrderPermission(BasePermission):
    @classmethod
    def has_permission(cls, info: GQLInfo) -> bool:
        return info.context.user.is_authenticated

    @classmethod
    def has_mutation_permission(cls, root: Any, info: GQLInfo, input: dict) -> bool:
        return False
