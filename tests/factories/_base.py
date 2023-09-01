from typing import Any, Generic, TypeVar

from django.db.models import Model
from factory import Factory
from factory.django import DjangoModelFactory

T = TypeVar("T")
TModel = TypeVar("TModel", bound=Model)


__all__ = [
    "GenericDjangoModelFactory",
    "GenericFactory",
]


class GenericDjangoModelFactory(DjangoModelFactory, Generic[TModel]):
    @classmethod
    def build(cls, **kwargs: Any) -> TModel:
        return super().build(**kwargs)

    @classmethod
    def create(cls, **kwargs: Any) -> TModel:
        return super().create(**kwargs)

    @classmethod
    def build_batch(cls, size: int, **kwargs: Any) -> list[TModel]:
        return super().build_batch(size, **kwargs)

    @classmethod
    def create_batch(cls, size: int, **kwargs: Any) -> list[TModel]:
        return super().create_batch(size, **kwargs)


class GenericFactory(Factory, Generic[T]):
    @classmethod
    def build(cls, **kwargs: Any) -> T:
        return super().build(**kwargs)

    @classmethod
    def create(cls, **kwargs: Any) -> T:
        return super().create(**kwargs)

    @classmethod
    def build_batch(cls, size: int, **kwargs: Any) -> list[T]:
        return super().build_batch(size, **kwargs)

    @classmethod
    def create_batch(cls, size: int, **kwargs: Any) -> list[T]:
        return super().create_batch(size, **kwargs)
