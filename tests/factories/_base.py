from typing import Any, Generic, TypeVar

from django.db.models import Model
from factory.django import DjangoModelFactory

TModel = TypeVar("TModel", bound=Model)


class GenericDjangoModelFactory(DjangoModelFactory, Generic[TModel]):
    @classmethod
    def build(cls, **kwargs: Any) -> TModel:
        return super().build(**kwargs)

    @classmethod
    def create(cls, **kwargs: Any) -> TModel:
        return super().create(**kwargs)

    @classmethod
    def build_batch(cls, size: int, **kwargs: Any) -> TModel:
        return super().build_batch(size, **kwargs)

    @classmethod
    def create_batch(cls, size: int, **kwargs: Any) -> TModel:
        return super().create_batch(size, **kwargs)
