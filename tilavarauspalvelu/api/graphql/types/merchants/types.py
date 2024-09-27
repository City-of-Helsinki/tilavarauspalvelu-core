import graphene
from graphene_django_extensions import DjangoNode
from query_optimizer import MultiField

from tilavarauspalvelu.enums import OrderStatus, PaymentType
from tilavarauspalvelu.models import PaymentMerchant, PaymentOrder, PaymentProduct
from tilavarauspalvelu.typing import GQLInfo
from utils.date_utils import local_datetime

from .permissions import PaymentOrderPermission

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
    order_uuid = MultiField(graphene.UUID, fields=["remote_id"])
    refund_uuid = MultiField(graphene.UUID, fields=["refund_id"])

    payment_type = graphene.Field(graphene.NonNull(graphene.Enum.from_enum(PaymentType)))
    status = graphene.Field(graphene.Enum.from_enum(OrderStatus))  # TODO: NonNull, requires frontend changes

    checkout_url = MultiField(graphene.String, fields=["checkout_url", "status", "created_at"])
    receipt_url = graphene.String()
    expires_in_minutes = MultiField(graphene.Int, fields=["status", "created_at"])
    processed_at = graphene.DateTime()

    reservation_pk = MultiField(graphene.String, fields=["reservation_id"])

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

    def resolve_reservation_pk(root: PaymentOrder, info: GQLInfo) -> str | None:
        return str(root.reservation_id) if root.reservation is not None else None

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
