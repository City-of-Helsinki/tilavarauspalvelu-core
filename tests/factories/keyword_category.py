from factory import LazyAttribute

from tilavarauspalvelu.models import KeywordCategory

from ._base import FakerEN, FakerFI, FakerSV, GenericDjangoModelFactory, ReverseForeignKeyFactory

__all__ = [
    "KeywordCategoryFactory",
]


class KeywordCategoryFactory(GenericDjangoModelFactory[KeywordCategory]):
    class Meta:
        model = KeywordCategory
        django_get_or_create = ["name"]

    name = FakerFI("word", unique=True)
    name_fi = LazyAttribute(lambda i: i.name)
    name_en = FakerEN("word")
    name_sv = FakerSV("word")

    keyword_groups = ReverseForeignKeyFactory("tests.factories.KeywordGroupFactory")
