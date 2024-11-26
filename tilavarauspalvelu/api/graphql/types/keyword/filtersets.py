from __future__ import annotations

from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from tilavarauspalvelu.models import Keyword, KeywordGroup

__all__ = [
    "KeywordCategoryFilterSet",
    "KeywordFilterSet",
    "KeywordGroupFilterSet",
]


class KeywordFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = Keyword
        fields = [
            "name_fi",
            "name_sv",
            "name_en",
        ]


class KeywordGroupFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = KeywordGroup
        fields = [
            "name_fi",
            "name_sv",
            "name_en",
        ]


class KeywordCategoryFilterSet(ModelFilterSet):
    pk = IntMultipleChoiceFilter()

    class Meta:
        model = KeywordGroup
        fields = [
            "name_fi",
            "name_sv",
            "name_en",
        ]
