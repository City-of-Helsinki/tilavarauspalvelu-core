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
    def build(cls: type[Generic[TModel]], **kwargs: Any) -> TModel:
        return super().build(**kwargs)

    @classmethod
    def create(cls: type[Generic[TModel]], **kwargs: Any) -> TModel:
        return super().create(**kwargs)

    @classmethod
    def build_batch(cls: type[Generic[TModel]], size: int, **kwargs: Any) -> list[TModel]:
        return super().build_batch(size, **kwargs)

    @classmethod
    def create_batch(cls: type[Generic[TModel]], size: int, **kwargs: Any) -> list[TModel]:
        return super().create_batch(size, **kwargs)

    @classmethod
    def pop_sub_kwargs(cls: type[Generic[TModel]], key: str, kwargs: dict[str, Any]) -> dict[str, Any]:
        sub_kwargs = {}
        for kwarg in kwargs.copy():
            if kwarg.startswith(f"{key}__"):
                sub_kwargs[kwarg.removeprefix(f"{key}__")] = kwargs.pop(kwarg)
        return sub_kwargs

    @classmethod
    def has_sub_kwargs(cls: type[Generic[TModel]], key: str, kwargs: dict[str, Any]) -> bool:
        return any(kwarg == key or kwarg.startswith(f"{key}__") for kwarg in kwargs)


class GenericFactory(Factory, Generic[T]):
    @classmethod
    def build(cls: Generic[T], **kwargs: Any) -> T:
        return super().build(**kwargs)

    @classmethod
    def create(cls: Generic[T], **kwargs: Any) -> T:
        return super().create(**kwargs)

    @classmethod
    def build_batch(cls: Generic[T], size: int, **kwargs: Any) -> list[T]:
        return super().build_batch(size, **kwargs)

    @classmethod
    def create_batch(cls: Generic[T], size: int, **kwargs: Any) -> list[T]:
        return super().create_batch(size, **kwargs)
