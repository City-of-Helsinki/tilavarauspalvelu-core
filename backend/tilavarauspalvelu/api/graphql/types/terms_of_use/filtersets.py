from __future__ import annotations

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
