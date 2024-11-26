from __future__ import annotations

from django_filters import MultipleChoiceFilter
from graphene_django_extensions import ModelFilterSet

from tilavarauspalvelu.models import TermsOfUse

__all__ = [
    "TermsOfUseFilterSet",
]


class TermsOfUseFilterSet(ModelFilterSet):
    pk = MultipleChoiceFilter()

    class Meta:
        model = TermsOfUse
        fields = [
            "pk",
            "terms_type",
        ]
