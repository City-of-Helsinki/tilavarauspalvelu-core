from undine import Field, GQLInfo, QueryType
from undine.exceptions import GraphQLPermissionError
from undine.relay import Node

from tilavarauspalvelu.models import PaymentMerchant, User

__all__ = [
    "PaymentMerchantNode",
]


class PaymentMerchantNode(QueryType[PaymentMerchant], interfaces=[Node]):
    pk = Field()
    name = Field()

    @classmethod
    def __permissions__(cls, instance: PaymentMerchant, info: GQLInfo[User]) -> None:
        user = info.context.user
        if not user.is_authenticated:
            msg = "No permission to access payment merchant."
            raise GraphQLPermissionError(msg)
