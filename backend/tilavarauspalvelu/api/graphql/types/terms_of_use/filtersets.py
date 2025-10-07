from __future__ import annotations

from graphene_django.filter import ListFilter
from graphene_django_extensions import ModelFilterSet

from tilavarauspalvelu.models import TermsOfUse

__all__ = [
    "TermsOfUseFilterSet",
]


class TermsOfUseFilterSet(ModelFilterSet):
    pk = ListFilter(lookup_expr="in")

    class Meta:
        model = TermsOfUse
        fields = [
            "pk",
            "terms_type",
        ]
