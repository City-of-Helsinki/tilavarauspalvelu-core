import factory
from factory import fuzzy

from tilavarauspalvelu.models import Keyword, KeywordCategory, KeywordGroup

from ._base import GenericDjangoModelFactory

__all__ = [
    "KeywordCategoryFactory",
    "KeywordFactory",
    "KeywordGroupFactory",
]


class KeywordFactory(GenericDjangoModelFactory[Keyword]):
    class Meta:
        model = Keyword

    name = fuzzy.FuzzyText()
    keyword_group = factory.SubFactory("tests.factories.KeywordGroupFactory")


class KeywordGroupFactory(GenericDjangoModelFactory[KeywordGroup]):
    class Meta:
        model = KeywordGroup

    name = fuzzy.FuzzyText()
    keyword_category = factory.SubFactory("tests.factories.KeywordCategoryFactory")


class KeywordCategoryFactory(GenericDjangoModelFactory[KeywordCategory]):
    class Meta:
        model = KeywordCategory

    name = fuzzy.FuzzyText()
