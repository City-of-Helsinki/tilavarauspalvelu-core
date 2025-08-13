from undine import Filter, FilterSet

from tilavarauspalvelu.models import TermsOfUse

__all__ = [
    "TermsOfUseFilterSet",
]


class TermsOfUseFilterSet(FilterSet[TermsOfUse]):
    pk = Filter(lookup="in")
    terms_type = Filter()
