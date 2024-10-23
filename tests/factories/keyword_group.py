from factory import LazyAttribute

from tilavarauspalvelu.models import KeywordGroup

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "KeywordGroupFactory",
]


class KeywordGroupFactory(GenericDjangoModelFactory[KeywordGroup]):
    class Meta:
        model = KeywordGroup
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    keyword_category = ForeignKeyFactory("tests.factories.KeywordCategoryFactory")
    keywords = ReverseForeignKeyFactory("tests.factories.KeywordFactory")
