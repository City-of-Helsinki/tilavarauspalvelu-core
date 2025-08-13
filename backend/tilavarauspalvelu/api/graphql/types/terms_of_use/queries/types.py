from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.models import TermsOfUse

from .filtersets import TermsOfUseFilterSet
from .orderset import TermsOfUseOrderSet

__all__ = [
    "TermsOfUseNode",
]


class TermsOfUseNode(
    QueryType[TermsOfUse],
    filterset=TermsOfUseFilterSet,
    orderset=TermsOfUseOrderSet,
    interfaces=[Node],
):
    pk = Field()

    name_fi = Field()
    name_sv = Field()
    name_en = Field()

    text_fi = Field()
    text_sv = Field()
    text_en = Field()

    terms_type = Field()
