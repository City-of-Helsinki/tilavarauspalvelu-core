from undine import Field, QueryType
from undine.relay import Node

from tilavarauspalvelu.api.graphql.extensions.utils import TranslatedField
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

    name = Field(TranslatedField)
    name_fi = Field(deprecation_reason="Use 'name' instead.")
    name_sv = Field(deprecation_reason="Use 'name' instead.")
    name_en = Field(deprecation_reason="Use 'name' instead.")

    text = Field(TranslatedField)
    text_fi = Field(deprecation_reason="Use 'text' instead.")
    text_sv = Field(deprecation_reason="Use 'text' instead.")
    text_en = Field(deprecation_reason="Use 'text' instead.")

    terms_type = Field()
