import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from api.graphql.types.merchants.permissions import PaymentOrderPermission
from common.date_utils import local_datetime
from common.typing import GQLInfo
from merchants.models import PaymentMerchant, PaymentOrder, PaymentProduct


class PaymentMerchantType(AuthNode, OldPrimaryKeyObjectType):
    pk = graphene.String()

    class Meta:
        model = PaymentMerchant
        fields = [
            "pk",
            "name",
        ]

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection


class PaymentProductType(AuthNode, OldPrimaryKeyObjectType):
    pk = graphene.String()
    merchant_pk = graphene.String()

    class Meta:
        model = PaymentProduct
        fields = ["pk", "merchant_pk"]

        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_merchant_pk(root: PaymentProduct, info: GQLInfo) -> str:
        return root.merchant.pk


class PaymentOrderType(AuthNode, OldPrimaryKeyObjectType):
    permission_classes = (PaymentOrderPermission,)

    order_uuid = graphene.String()
    status = graphene.String()
    payment_type = graphene.String()
    processed_at = graphene.DateTime()
    checkout_url = graphene.String()
    receipt_url = graphene.String()
    reservation_pk = graphene.String()
    refund_id = graphene.String()
    expires_in_minutes = graphene.Int()

    class Meta:
        model = PaymentOrder
        fields = [
            "order_uuid",
            "status",
            "payment_type",
            "processed_at",
            "checkout_url",
            "receipt_url",
            "reservation_pk",
            "refund_id",
            "expires_in_minutes",
        ]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_order_uuid(root: PaymentOrder, info: GQLInfo) -> str | None:
        return root.remote_id

    def resolve_reservation_pk(root: PaymentOrder, info: GQLInfo) -> str:
        return root.reservation.pk

    def resolve_checkout_url(root: PaymentOrder, info: GQLInfo) -> str | None:
        expires_at = root.expires_at
        now = local_datetime()

        if not expires_at or now >= expires_at:
            return None

        return root.checkout_url

    def resolve_expires_in_minutes(root: PaymentOrder, info: GQLInfo) -> int | None:
        expires_at = root.expires_at
        now = local_datetime()

        if not expires_at or now >= expires_at:
            return None

        return (expires_at - now).seconds // 60
