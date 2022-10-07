import graphene
from graphene_permissions.mixins import AuthNode

from api.graphql.base_connection import TilavarausBaseConnection
from api.graphql.base_type import PrimaryKeyObjectType
from merchants.models import PaymentMerchant, PaymentProduct


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
