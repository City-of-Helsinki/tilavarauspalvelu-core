from __future__ import annotations

import datetime
import logging
from contextlib import suppress
from copy import copy, deepcopy
from types import UnionType
from typing import TYPE_CHECKING, Any, Literal, Self, Union, get_origin, get_type_hints, is_typeddict

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
    "GenericListFactory",
    "ManyToManyFactory",
    "ReverseForeignKeyFactory",
    "ReverseOneToOneFactory",
    "ValidatedGenericFactory",
]


logger = logging.getLogger(__name__)


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


class _PostFactory[T](PostGeneration):
    def __init__(self, factory: FactoryType) -> None:
        super().__init__(function=self.generate)
        self.field_name: str = ""
        self.factory_wrapper = _CustomFactoryWrapper(factory)

    def __set_name__(self, owner: Any, name: str) -> None:
        """Set the name of the field in the factory this is in."""
        self.field_name = name

    def get_factory(self) -> BaseFactory:
        return self.factory_wrapper.get()

    def generate(self, instance: Model, create: bool, values: Iterable[T] | None, **kwargs: Any) -> None:
        raise NotImplementedError


# --- Generic factories --------------------------------------------------------------------------------------------


class GenericDjangoModelFactory[TModel: Model](DjangoModelFactory):
    """
    DjangoModelFactory that adds return type annotations for the
    `build`, `create`, `build_batch`, and `create_batch` methods,
    as well as some convenience methods for creating custom builder-methods.
    """

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

    @classmethod
    def pop_sub_kwargs(cls, key: str, kwargs: dict[str, Any]) -> dict[str, Any]:
        sub_kwargs = {}
        for kwarg in kwargs.copy():
            if kwarg.startswith(f"{key}__"):
                sub_kwargs[kwarg.removeprefix(f"{key}__")] = kwargs.pop(kwarg)
        return sub_kwargs

    @classmethod
    def has_sub_kwargs(cls, key: str, kwargs: dict[str, Any]) -> bool:
        return any(kwarg == key or kwarg.startswith(f"{key}__") for kwarg in kwargs)


class GenericFactoryValidationError(Exception):
    """Raised when a generic factory fails to create an object."""


class GenericFactory[T](Factory):
    """Same as `GenericDjangoModelFactory`, but for regular factories."""

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


class ValidatedGenericFactory[T](GenericFactory[T]):
    """
    Adds some validation logic to the output of the GenericFactory.

    Assumes that the model for the Factory is a TypedDict of a dataclass,
    in which case we can check the output against its annotations.
    """

    @classmethod
    def _generate(cls, strategy: str, params: dict[str, Any]) -> T:
        result = super()._generate(strategy, params)
        cls._check_result_matches_model(result)
        return result

    @classmethod
    def _check_result_matches_model(cls, result: Any) -> None:
        model: type[T] = cls._meta.model
        if model is None:
            return

        msg = (
            f"Factory {cls.__name__!r} returned an object of type {type(result)!r}, "
            f"but expected an object of type {model!r}."
        )
        error = GenericFactoryValidationError(msg)

        # Assume model is a TypedDict if it's a dict subclass
        # (TypedDicts cannot be used in isinstance checks)
        if issubclass(model, dict):
            if not isinstance(result, dict):
                raise error

        elif not isinstance(result, model):
            raise error

        errors: list[GenericFactoryValidationError] = []

        # Attempt to do some simple type checking on the fields of the model.
        # This should catch most of the common cases, like missing fields,
        # wrong types, but won't cover nested objects.
        try:
            type_hints = get_type_hints(model)
        except Exception as error:
            msg = f"Factory {cls.__name__!r} output cannot be checked. Failed to get type hints for {model!r}."
            logger.exception(msg, exc_info=error)
            return

        for field, field_type in type_hints.items():
            value = cls._get_object_value(result=result, field=field)

            try:
                cls._check_value(field=field, field_type=field_type, value=value)
            except GenericFactoryValidationError as error:
                errors.append(error)
                continue

        if errors:
            msg = f"Factory {cls.__name__!r} returned an object with invalid data."
            raise ExceptionGroup(msg, errors)

    @classmethod
    def _get_object_value(cls, result: Any, field: str) -> Any:
        with suppress(KeyError, TypeError):
            return result[field]

        with suppress(AttributeError):
            return getattr(result, field)

        return ...  # Sentinel value, indicating that the field was not found

    @classmethod
    def _check_value(cls, field: str, field_type: Any, value: Any) -> None:
        if value is ...:
            msg = f"Factory {cls.__name__!r} returned an object with missing field {field!r}."
            raise GenericFactoryValidationError(msg)

        # Get the origin of a type if it is a Generic, e.g. list[int] -> list
        origin_type = get_origin(field_type) or field_type

        if origin_type is Any:
            return

        if is_typeddict(field_type):
            return

        if origin_type is Literal:
            cls._check_literal(field, field_type, value)
            return

        if origin_type in {Union, UnionType}:
            cls._check_union(field, field_type, value)
            return

        if origin_type is list:
            cls._check_list(field, field_type, value)
            return

        if origin_type is dict:
            cls._check_dict(field, field_type, value)
            return

        cls._check_leaf_type(field, field_type, value)

    @classmethod
    def _check_literal(cls, field: str, field_type: Any, value: Any) -> None:
        if value not in field_type.__args__:
            msg = (
                f"Factory {cls.__name__!r} returned an object with field {field!r} with "
                f"value {value!r}, but expected one of {field_type.__args__!r}."
            )
            raise GenericFactoryValidationError(msg)

    @classmethod
    def _check_union(cls, field: str, field_type: Any, value: Any) -> None:
        for sub_type in field_type.__args__:
            with suppress(GenericFactoryValidationError):
                cls._check_value(field, sub_type, value)
            return

        msg = (
            f"Factory {cls.__name__!r} returned an object with field {field!r} with "
            f"value {value!r}, but expected one of {field_type.__args__!r}."
        )
        raise GenericFactoryValidationError(msg)

    @classmethod
    def _check_list(cls, field: str, field_type: Any, value: Any) -> None:
        if not isinstance(value, list):
            msg = (
                f"Factory {cls.__name__!r} returned an object with field {field!r} with "
                f"value {value!r}, but expected a list."
            )
            raise GenericFactoryValidationError(msg)

        list_type = field_type.__args__[0]

        for i, item in enumerate(value):
            try:
                cls._check_value(f"{field}[{i}]", list_type, item)
            except GenericFactoryValidationError as error:
                msg = (
                    f"Factory {cls.__name__!r} returned an object with field {field!r} with "
                    f"list containing {value!r}, but expected a list of {list_type!r}."
                )
                raise GenericFactoryValidationError(msg) from error

    @classmethod
    def _check_dict(cls, field: str, field_type: Any, value: Any) -> None:
        if not isinstance(value, dict):
            msg = (
                f"Factory {cls.__name__!r} returned an object with field {field!r} of "
                f"value {value!r}, but expected a dict."
            )
            raise GenericFactoryValidationError(msg)

        key_type, value_type = field_type.__args__

        for key, item in value.items():
            try:
                cls._check_value(f"{field}[{key}]", key_type, key)
            except GenericFactoryValidationError as error:
                msg = (
                    f"Factory {cls.__name__!r} returned an object with field {field!r} with "
                    f"dict containing key {value!r}, but expected keys to be of type {key_type!r}."
                )
                raise GenericFactoryValidationError(msg) from error

            try:
                cls._check_value(f"{field}[{key}]", value_type, item)
            except GenericFactoryValidationError as error:
                msg = (
                    f"Factory {cls.__name__!r} returned an object with field {field!r} with "
                    f"dict containing value {item!r}, but expected values to be of type {value_type!r}."
                )
                raise GenericFactoryValidationError(msg) from error

    @classmethod
    def _check_leaf_type(cls, field: str, field_type: Any, value: Any) -> None:
        origin_type = get_origin(field_type) or field_type

        try:
            is_correct_type = isinstance(value, origin_type)
        except TypeError as err:
            logger.exception(f"Failed to check type of {value!r} for {field!r}", exc_info=err)
            return

        if not is_correct_type:
            msg = (
                f"Factory {cls.__name__!r} returned an object with field {field!r} of type "
                f"{type(value)!r}, but expected an object of type {origin_type!r}."
            )
            raise GenericFactoryValidationError(msg)


class GenericListFactory[T](_PostFactory[T]):
    """Field factory for generating a list of values using another GenericFactory."""

    def generate(self, instance: Any, create: bool, values: Iterable[T] | None, **kwargs: Any) -> None:
        if values is None:
            factory = self.get_factory()
            item = factory.create(**kwargs) if create else factory.build(**kwargs)
            values = [item]

        if isinstance(instance, dict):
            instance[self.field_name] = values
        else:
            setattr(instance, self.field_name, values)


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
            manager = getattr(instance, self.field_name)
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
        if models:
            if create:
                for model in models or []:
                    getattr(instance, self.field_name).add(model)

        elif kwargs:
            factory = self.get_factory()
            if create:
                model = factory.create(**kwargs)
                getattr(instance, self.field_name).add(model)
            else:
                factory.build(**kwargs)


def coerce_date(date: datetime.date | datetime.datetime) -> datetime.date:
    if isinstance(date, datetime.datetime):
        return date.date()
    return date
