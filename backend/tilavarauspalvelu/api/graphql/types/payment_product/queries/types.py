from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import PaymentProduct

__all__ = [
    "PaymentProductNode",
]


class PaymentProductNode(QueryType[PaymentProduct], interfaces=[Node]):
    pk = Field()
    merchant = Field()
