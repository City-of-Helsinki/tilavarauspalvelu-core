from graphene_django_extensions import ModelFilterSet
from graphene_django_extensions.filters import IntMultipleChoiceFilter

from reservation_units.models import Keyword, KeywordGroup

__all__ = [
    "KeywordFilterSet",
    "KeywordGroupFilterSet",
    "KeywordCategoryFilterSet",
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
