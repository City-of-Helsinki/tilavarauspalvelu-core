from __future__ import annotations

from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import IntendedUse

__all__ = [
    "IntendedUseFilterSet",
]


class IntendedUseFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = IntendedUse
        fields = [
            "name_fi",
            "name_en",
            "name_sv",
        ]
        order_by = [
            "rank",
            "name_fi",
            "name_en",
            "name_sv",
        ]
