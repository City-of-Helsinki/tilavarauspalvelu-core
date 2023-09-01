from factory import fuzzy

from reservation_units.models import Keyword, KeywordCategory, KeywordGroup

from ._base import GenericDjangoModelFactory

__all__ = [
    "KeywordFactory",
    "KeywordGroupFactory",
    "KeywordCategoryFactory",
]


class KeywordFactory(GenericDjangoModelFactory[Keyword]):
    class Meta:
        model = Keyword

    name = fuzzy.FuzzyText()
    keyword_group = None


class KeywordGroupFactory(GenericDjangoModelFactory[KeywordGroup]):
    class Meta:
        model = KeywordGroup

    name = fuzzy.FuzzyText()
    keyword_category = None


class KeywordCategoryFactory(GenericDjangoModelFactory[KeywordCategory]):
    class Meta:
        model = KeywordCategory

    name = fuzzy.FuzzyText()
