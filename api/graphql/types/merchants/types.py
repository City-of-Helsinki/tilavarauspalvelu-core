import graphene
from graphene_django_extensions import DjangoNode

from api.graphql.types.merchants.permissions import PaymentOrderPermission
from common.date_utils import local_datetime
from common.typing import GQLInfo
from merchants.enums import OrderStatus
from merchants.models import PaymentMerchant, PaymentOrder, PaymentProduct

__all__ = [
    "PaymentMerchantNode",
    "PaymentOrderNode",
    "PaymentProductNode",
]


class PaymentMerchantNode(DjangoNode):
    pk = graphene.UUID()

    class Meta:
        model = PaymentMerchant
        fields = [
            "pk",
            "name",
        ]


class PaymentProductNode(DjangoNode):
    pk = graphene.UUID()

    class Meta:
        model = PaymentProduct
        fields = [
            "pk",
            "merchant",
        ]


class PaymentOrderNode(DjangoNode):
    order_uuid = graphene.UUID()
    refund_uuid = graphene.UUID()
    reservation_pk = graphene.String()
    checkout_url = graphene.String()
    receipt_url = graphene.String()
    expires_in_minutes = graphene.Int()

    status = graphene.Field(graphene.Enum.from_enum(OrderStatus))

    class Meta:
        model = PaymentOrder
        fields = [
            "order_uuid",
            "refund_uuid",
            "payment_type",
            "status",
            "checkout_url",
            "receipt_url",
            "expires_in_minutes",
            "processed_at",
            "reservation_pk",
        ]
        permission_classes = [PaymentOrderPermission]

    def resolve_order_uuid(root: PaymentOrder, info: GQLInfo) -> str | None:
        return root.remote_id

    def resolve_refund_uuid(root: PaymentOrder, info: GQLInfo) -> str | None:
        return root.refund_id

    def resolve_reservation_pk(root: PaymentOrder, info: GQLInfo) -> str:
        return root.reservation.pk

    def resolve_checkout_url(root: PaymentOrder, info: GQLInfo) -> str | None:
        expires_at = root.expires_at
        now = local_datetime()

        if not expires_at or now >= expires_at:
            return None

        return root.checkout_url or None

    def resolve_receipt_url(root: PaymentOrder, info: GQLInfo) -> str | None:
        return root.receipt_url or None

    def resolve_expires_in_minutes(root: PaymentOrder, info: GQLInfo) -> int | None:
        expires_at = root.expires_at
        now = local_datetime()

        if not expires_at or now >= expires_at:
            return None

        return (expires_at - now).seconds // 60
