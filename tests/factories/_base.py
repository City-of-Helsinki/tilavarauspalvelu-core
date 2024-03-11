from collections.abc import Iterable
from typing import Any, Generic, TypeVar

from django.db.models import Model
from factory import Factory, PostGeneration, SubFactory
from factory.builder import BuildStep, Resolver
from factory.declarations import _FactoryWrapper
from factory.django import DjangoModelFactory

T = TypeVar("T")
TModel = TypeVar("TModel", bound=Model)


__all__ = [
    "GenericDjangoModelFactory",
    "GenericFactory",
    "ManyToManyFactory",
    "NullableSubFactory",
    "OneToManyFactory",
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


class NullableSubFactory(SubFactory, Generic[TModel]):
    """
    A SubFactory where te default value can be None.
    If arguments are passed, i.e. `model__argument=value`,
    the default None setting will be ignored.
    """

    def __init__(self, factory: str | Factory, *, null: bool = False, **kwargs: Any) -> None:
        self.null = null
        super().__init__(factory, **kwargs)

    def evaluate(self, instance: Resolver, step: BuildStep, extra: dict[str, Any]) -> TModel | None:
        if not extra and self.null:
            return None
        return super().evaluate(instance, step, extra)


class ManyFactory(PostGeneration, Generic[TModel]):
    """Factory for many-related fields."""

    def __init__(self, factory: str | Factory) -> None:
        super().__init__(function=self.generate)
        self.field_name: str = ""
        self.factory_wrapper = _FactoryWrapper(factory)

    def __set_name__(self, owner: Any, name: str) -> None:
        """Set the name of the field in the factory this is in."""
        self.field_name = name

    def get_factory(self) -> Factory:
        return self.factory_wrapper.get()

    def generate(self, instance: Model, create: bool, models: Iterable[TModel] | None, **kwargs: Any) -> None:
        raise NotImplementedError

    def manager(self, instance: Model) -> Any:
        # to-one fields:
        # - django.db.models.fields.related_descriptors.create_reverse_many_to_one_manager -> RelatedManager
        # to-many fields:
        # - django.db.models.fields.related_descriptors.create_forward_many_to_many_manager -> ManyRelatedManager
        return getattr(instance, self.field_name)


class ManyToManyFactory(ManyFactory[TModel]):
    """Factory for many-to-many related fields."""

    def generate(self, instance: Model, create: bool, models: Iterable[TModel] | None, **kwargs: Any) -> None:
        if not models and kwargs:
            factory = self.get_factory()
            model = factory.create(**kwargs) if create else factory.build(**kwargs)
            self.manager(instance).add(model)

        for model in models or []:
            self.manager(instance).add(model)


class OneToManyFactory(ManyFactory[TModel]):
    """Factory for one-to-many related fields."""

    def generate(self, instance: Model, create: bool, models: Iterable[TModel] | None, **kwargs: Any) -> None:
        if not models and kwargs:
            factory = self.get_factory()
            kwargs.setdefault(self.manager(instance).field.name, instance)
            factory.create(**kwargs) if create else factory.build(**kwargs)
