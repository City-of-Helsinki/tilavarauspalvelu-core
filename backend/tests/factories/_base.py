from __future__ import annotations

from copy import copy, deepcopy
from typing import TYPE_CHECKING, Any, Self

import faker
from django.contrib.contenttypes.fields import GenericForeignKey
from django.db.models import Model
from factory import Factory, FactoryError, Faker, PostGeneration, SubFactory
from factory.base import BaseFactory
from factory.django import DjangoModelFactory
from factory.utils import import_object

from .providers import CUSTOM_PROVIDERS

if TYPE_CHECKING:
    from collections.abc import Callable, Iterable

    from factory.builder import BuildStep, Resolver

    from ._typing import ENProviders, FactoryType, FIProviders, SVProviders

__all__ = [
    "FakerEN",
    "FakerFI",
    "FakerSV",
    "ForeignKeyFactory",
    "ForwardOneToOneFactory",
    "GenericDjangoModelFactory",
    "GenericFactory",
    "ManyToManyFactory",
    "ReverseForeignKeyFactory",
    "ReverseOneToOneFactory",
]


class BaseFaker(Faker):
    """Adds the option to use a unique-valued faker if `unique=True` is passed to the factory."""

    @classmethod
    def clear_unique(cls) -> None:
        """Reset uniqueness of all faker generators."""
        cls._get_faker().unique.clear()

    def evaluate(self, instance: Resolver, step: BuildStep, extra: dict[str, Any]) -> Any:
        unique = extra.pop("unique", False)
        return self.generate(unique=unique, **extra)

    def generate(self, *, unique: bool = False, **kwargs: Any) -> Any:
        """
        Allows generating new values manually.

        >>> class FooFactory(GenericDjangoModelFactory[Foo]):
        ...     name = FakerFI("name")
        ...
        ...     @classmethod
        ...     def create(cls, **kwargs: Any) -> Foo:
        ...         name = cls.name.generate()  # Generates a random name here.
        ...         kwargs["name"] = f"<b>{name}</b>"
        ...         return super().create(**kwargs)
        """
        kwargs.pop("locale", self._DEFAULT_LOCALE)
        faker_instance = self._get_faker()
        if unique:
            faker_instance = faker_instance.unique
        return faker_instance.format(self.provider, **kwargs)

    @classmethod
    def _get_faker(cls, locale: Any = None) -> faker.Faker:
        locale = cls._DEFAULT_LOCALE

        if locale not in cls._FAKER_REGISTRY:
            faker_instance = faker.Faker(
                locale=cls._DEFAULT_LOCALE,
                includes=CUSTOM_PROVIDERS,
            )
            cls._FAKER_REGISTRY[locale] = faker_instance

        return cls._FAKER_REGISTRY[locale]


class FakerFI(BaseFaker):
    _DEFAULT_LOCALE = "fi_FI"

    def __init__(self, provider: FIProviders, **kwargs: Any) -> None:
        super().__init__(provider=provider, **kwargs)


class FakerSV(BaseFaker):
    _DEFAULT_LOCALE = "sv_SE"

    def __init__(self, provider: SVProviders, **kwargs: Any) -> None:
        super().__init__(provider=provider, **kwargs)


class FakerEN(BaseFaker):
    _DEFAULT_LOCALE = "en_US"

    def __init__(self, provider: ENProviders, **kwargs: Any) -> None:
        super().__init__(provider=provider, **kwargs)


class _CustomFactoryWrapper:
    def __init__(self, factory_: FactoryType) -> None:
        self.factory: type[BaseFactory] | None = None
        self.callable: Callable[..., type[BaseFactory]] | None = None

        if isinstance(factory_, type) and issubclass(factory_, BaseFactory):
            self.factory = factory_
            return

        if callable(factory_):
            self.callable = factory_
            return

        if not (isinstance(factory_, str) and "." in factory_):
            msg = (
                "The factory must be one of: "
                "1) a string with the format 'module.path.FactoryClass' "
                "2) a Factory class "
                "3) a callable that returns a Factory class"
            )
            raise FactoryError(msg)

        self.callable = lambda: import_object(*factory_.rsplit(".", 1))

    def get(self) -> FactoryType:
        if self.factory is None:
            self.factory = self.callable()
        return self.factory


class _PostFactory[TModel: Model](PostGeneration):
    def __init__(self, factory: FactoryType) -> None:
        super().__init__(function=self.generate)
        self.field_name: str = ""
        self.factory_wrapper = _CustomFactoryWrapper(factory)

    def __set_name__(self, owner: Any, name: str) -> None:
        """Set the name of the field in the factory this is in."""
        self.field_name = name

    def get_factory(self) -> BaseFactory:
        return self.factory_wrapper.get()

    def generate(self, instance: Model, create: bool, models: Iterable[TModel] | None, **kwargs: Any) -> None:
        raise NotImplementedError

    def manager(self, instance: Model) -> Any:
        """
        Find the related manager for the instance based on the field name it was defined with on the factory.

        Note that due to how Django handles related fields, the manager type is created dynamically at runtime.

        For one-to-many fields:
        - django.db.models.fields.related_descriptors.create_reverse_many_to_one_manager -> RelatedManager
        For many-to-many fields:
        - django.db.models.fields.related_descriptors.create_forward_many_to_many_manager -> ManyRelatedManager
        """
        return getattr(instance, self.field_name)


# --- Generic factories --------------------------------------------------------------------------------------------


class GenericDjangoModelFactory[TModel: Model](DjangoModelFactory):
    """
    DjangoModelFactory that adds return type annotations for the
    `build`, `create`, `build_batch`, and `create_batch` methods,
    as well as some convenience methods for creating custom builder-methods.
    """

    @classmethod
    def build(cls: TModel, **kwargs: Any) -> TModel:
        return super().build(**kwargs)

    @classmethod
    def create(cls: TModel, **kwargs: Any) -> TModel:
        return super().create(**kwargs)

    @classmethod
    def build_batch(cls: TModel, size: int, **kwargs: Any) -> list[TModel]:
        return super().build_batch(size, **kwargs)

    @classmethod
    def create_batch(cls: TModel, size: int, **kwargs: Any) -> list[TModel]:
        return super().create_batch(size, **kwargs)

    @classmethod
    def pop_sub_kwargs(cls: TModel, key: str, kwargs: dict[str, Any]) -> dict[str, Any]:
        sub_kwargs = {}
        for kwarg in kwargs.copy():
            if kwarg.startswith(f"{key}__"):
                sub_kwargs[kwarg.removeprefix(f"{key}__")] = kwargs.pop(kwarg)
        return sub_kwargs

    @classmethod
    def has_sub_kwargs(cls: TModel, key: str, kwargs: dict[str, Any]) -> bool:
        return any(kwarg == key or kwarg.startswith(f"{key}__") for kwarg in kwargs)


class GenericFactory[T](Factory):
    """Same as `GenericDjangoModelFactory`, but for regular factories."""

    @classmethod
    def build(cls: T, **kwargs: Any) -> T:
        return super().build(**kwargs)

    @classmethod
    def create(cls: T, **kwargs: Any) -> T:
        return super().create(**kwargs)

    @classmethod
    def build_batch(cls: T, size: int, **kwargs: Any) -> list[T]:
        return super().build_batch(size, **kwargs)

    @classmethod
    def create_batch(cls: T, size: int, **kwargs: Any) -> list[T]:
        return super().create_batch(size, **kwargs)


class ModelFactoryBuilder[TModel: Model]:
    """
    Allows using the builder pattern to build-up kwargs for factories.
    Subclass this class and add custom builder methods to it.
    """

    # Add the factory class to this attribute in subclasses!
    factory: type[GenericDjangoModelFactory[TModel]]

    def __init__(self) -> None:
        self.kwargs: dict[str, Any] = {}

    def copy(self) -> Self:
        new = self.__class__()
        new.kwargs.update(copy(self.kwargs))
        return new

    def deepcopy(self) -> Self:
        new = self.__class__()
        new.kwargs.update(deepcopy(self.kwargs))
        return new

    def set(self, **kwargs: Any) -> Self:
        self.kwargs.update(kwargs)
        return self

    def build(self, **kwargs: Any) -> TModel:
        return self.factory.build(**(self.kwargs | kwargs))

    def create(self, **kwargs: Any) -> TModel:
        return self.factory.create(**(self.kwargs | kwargs))

    def build_batch(self, size: int, **kwargs: Any) -> list[TModel]:
        return self.factory.build_batch(size, **(self.kwargs | kwargs))

    def create_batch(self, size: int, **kwargs: Any) -> list[TModel]:
        return self.factory.create_batch(size, **(self.kwargs | kwargs))


# --- Related factories --------------------------------------------------------------------------------------------


class ForeignKeyFactory[TModel: Model](SubFactory):
    """
    Factory for forward 'many-to-one' (foreign key) related fields.

    Basically the same as a SubFactory, but will not create a related object if:
    1. The relation can be null AND
    2. The related instance is not specified OR its specified as 'None' AND
    3. The 'required' argument on the factory is set to 'False' (default).
    """

    def __init__(self, factory: FactoryType, required: bool = False, **kwargs: Any) -> None:  # noqa: FBT002
        # Skip SubFactory.__init__ to replace its factory wrapper with ours
        self.required = required
        super(SubFactory, self).__init__(**kwargs)
        self.factory_wrapper = _CustomFactoryWrapper(factory)

    def __set_name__(self, owner: type[GenericDjangoModelFactory], name: str) -> None:
        self.owner = owner
        self.name = name

    @property
    def null(self) -> bool:
        if self.required:
            return False
        return self.owner._meta.model._meta.get_field(self.name).null

    def evaluate(self, instance: Resolver, step: BuildStep, extra: dict[str, Any]) -> TModel | None:
        if not extra and self.null:
            return None
        return super().evaluate(instance, step, extra)


ForwardOneToOneFactory = ForeignKeyFactory
"""
Factory for forward 'one-to-one' related fields.
Basically the same as a SubFactory, but allows the related value to be 'None'.
"""


class ReverseOneToOneFactory[TModel: Model](_PostFactory[TModel]):
    """
    Factory for reverse 'one-to-one' related fields.
    If given the related model, or 'factory style arguments' (related__field=value),
    the related object is created and linked to the current instance.
    """

    def generate(self, instance: Model, create: bool, models: Iterable[TModel] | None, **kwargs: Any) -> None:
        if not models and kwargs:
            factory = self.get_factory()
            field_name = instance._meta.get_field(self.field_name).remote_field.name
            kwargs.setdefault(field_name, instance)
            factory.create(**kwargs) if create else factory.build(**kwargs)


class ReverseForeignKeyFactory[TModel: Model](_PostFactory[TModel]):
    """
    Factory for reverse foreign keys (one-to-many).
    If given the related model, or "factory style arguments" (related__field=value),
    a single related object is created and linked to the current instance.
    """

    def generate(self, instance: Model, create: bool, models: Iterable[TModel] | None, **kwargs: Any) -> None:
        if not models and kwargs:
            factory = self.get_factory()
            manager = self.manager(instance)
            try:
                field_name = manager.field.name
            except AttributeError:
                # GenericForeignKey
                field = next(
                    field
                    for field in manager.model._meta.get_fields()
                    if (
                        isinstance(field, GenericForeignKey)
                        and field.fk_field == manager.object_id_field_name
                        and field.ct_field == manager.content_type_field_name
                    )
                )
                field_name = field.name
            kwargs.setdefault(field_name, instance)
            factory.create(**kwargs) if create else factory.build(**kwargs)


class ManyToManyFactory[TModel: Model](_PostFactory[TModel]):
    """
    Factory for forward/reverse many-to-many related fields.
    If given the related model, or "factory style arguments" (related__field=value),
    a single related object is created and linked to the current instance.
    """

    def generate(self, instance: Model, create: bool, models: Iterable[TModel] | None, **kwargs: Any) -> None:
        if not models and kwargs:
            factory = self.get_factory()
            model = factory.create(**kwargs) if create else factory.build(**kwargs)
            self.manager(instance).add(model)

        for model in models or []:
            self.manager(instance).add(model)
