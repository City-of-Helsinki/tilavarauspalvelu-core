from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import TaxPercentage

from .filtersets import TaxPercentageFilterSet
from .ordersets import TaxPercentageOrderSet

__all__ = [
    "TaxPercentageNode",
]


class TaxPercentageNode(
    QueryType[TaxPercentage],
    filterset=TaxPercentageFilterSet,
    orderset=TaxPercentageOrderSet,
    interfaces=[Node],
):
    pk = Field()
    value = Field()
