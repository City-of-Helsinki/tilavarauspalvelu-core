from factory import LazyAttribute

from tilavarauspalvelu.models import Keyword

from ._base import FakerEN, FakerFI, FakerSV, ForeignKeyFactory, GenericDjangoModelFactory

__all__ = [
    "KeywordFactory",
]


class KeywordFactory(GenericDjangoModelFactory[Keyword]):
    class Meta:
        model = Keyword
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    keyword_group = ForeignKeyFactory("tests.factories.KeywordGroupFactory")
