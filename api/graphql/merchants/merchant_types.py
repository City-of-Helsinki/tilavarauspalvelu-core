from typing import Optional

import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from merchants.models import PaymentMerchant, PaymentOrder, PaymentProduct
from permissions.api_permissions.graphene_permissions import PaymentOrderPermission


class PaymentMerchantType(AuthNode, PrimaryKeyObjectType):
    pk = graphene.String()

    class Meta:
        model = PaymentMerchant
        fields = [
            "pk",
            "name",
        ]

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection


class PaymentProductType(AuthNode, PrimaryKeyObjectType):
    pk = graphene.String()
    merchant_pk = graphene.String()

    class Meta:
        model = PaymentProduct
        fields = ["pk", "merchant_pk"]

        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_merchant_pk(self, info) -> str:
        return self.merchant.pk


class PaymentOrderType(AuthNode, PrimaryKeyObjectType):
    permission_classes = (PaymentOrderPermission,)

    order_uuid = graphene.String()
    status = graphene.String()
    payment_type = graphene.String()
    processed_at = graphene.DateTime()
    checkout_url = graphene.String()
    receipt_url = graphene.String()
    reservation_pk = graphene.String()

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
        ]
        interfaces = (graphene.relay.Node,)
        connection_class = TilavarausBaseConnection

    def resolve_order_uuid(self, info) -> Optional[str]:
        return self.remote_id

    def resolve_reservation_pk(self, info) -> str:
        return self.reservation.pk
