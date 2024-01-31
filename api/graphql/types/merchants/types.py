from datetime import UTC, datetime, timedelta

import graphene
from django.conf import settings
from django.utils.timezone import get_default_timezone
from graphene_permissions.mixins import AuthNode

from api.graphql.extensions.base_types import TVPBaseConnection
from api.graphql.extensions.legacy_helpers import OldPrimaryKeyObjectType
from api.graphql.types.merchants.permissions import PaymentOrderPermission
from common.typing import GQLInfo
from merchants.models import OrderStatus, PaymentMerchant, PaymentOrder, PaymentProduct


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
        ]
        interfaces = (graphene.relay.Node,)
        connection_class = TVPBaseConnection

    def resolve_order_uuid(root: PaymentOrder, info: GQLInfo) -> str | None:
        return root.remote_id

    def resolve_reservation_pk(root: PaymentOrder, info: GQLInfo) -> str:
        return root.reservation.pk

    def resolve_checkout_url(root: PaymentOrder, info: GQLInfo) -> str | None:
        if root.status != OrderStatus.DRAFT:
            return None

        now = datetime.now(tz=UTC).astimezone(get_default_timezone())
        expired = now - timedelta(minutes=settings.VERKKOKAUPPA_ORDER_EXPIRATION_MINUTES)

        if root.created_at > expired:
            return root.checkout_url

        return None
