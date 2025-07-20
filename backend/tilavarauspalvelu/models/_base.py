from __future__ import annotations

from typing import Any, Generic, TypeVar

from django.db.models import Model, QuerySet
from django.db.models.manager import BaseManager
from helsinki_gdpr.models import SerializableMixin
from mptt.managers import TreeManager
from mptt.models import MPTTModel
from mptt.querysets import TreeQuerySet

__all__ = [
    "ManyToManyRelatedManager",
    "ModelManager",
    "ModelQuerySet",
    "ModelTreeManager",
    "ModelTreeQuerySet",
    "OneToManyRelatedManager",
    "SerializableModelManagerMixin",
    "SerializableModelMixin",
]

TModel = TypeVar("TModel", bound=Model)
TMPTTModel = TypeVar("TMPTTModel", bound=MPTTModel)
TQuerySet = TypeVar("TQuerySet", bound=QuerySet)


class ModelManagerMeta(type):
    """
    Metaclass that allows Manager subclassing to automatically copy queryset methods.
    So, instead of using `Manager.from_queryset(QuerySet)`, you can use `Manager[Model, QuerySet]`.
    """

    def __new__(cls, name: str, bases: tuple[type, ...], attrs: dict[str, Any]) -> ModelManagerMeta:
        if hasattr(ModelManagerMeta, "__queryset_class__"):
            queryset_class = ModelManagerMeta.__queryset_class__
            del ModelManagerMeta.__queryset_class__

            attrs["_queryset_class"] = queryset_class
            attrs |= BaseManager._get_queryset_methods(queryset_class)  # noqa: SLF001

        return super().__new__(cls, name, bases, attrs)

    def __getitem__(cls, item: tuple[type[Model], type[QuerySet]]) -> type[ModelManager[type[Model], type[QuerySet]]]:
        ModelManagerMeta.__queryset_class__ = item[1]
        return cls  # type: ignore[return-value]


# Normal models


class ModelQuerySet(Generic[TModel], QuerySet[TModel]): ...  # noqa: UP046


class ModelManager(Generic[TModel, TQuerySet], BaseManager[TModel], metaclass=ModelManagerMeta):  # noqa: UP046
    # Properly implement equality checks so that lazy managers are properly compared
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, type(self)):
            return NotImplemented
        return self._constructor_args == other._constructor_args  # type: ignore[attr-defined]

    # Copied from 'BaseManager.__hash__'
    def __hash__(self) -> int:
        return id(self)


# Related managers


class OneToManyRelatedManager(ModelManager[TModel, TQuerySet]): ...


class ManyToManyRelatedManager(ModelManager[TModel, TQuerySet]): ...


# MPTT models


class ModelTreeQuerySet(Generic[TMPTTModel], TreeQuerySet[TMPTTModel]): ...  # noqa: UP046


class ModelTreeManager(Generic[TMPTTModel, TQuerySet], TreeManager[TMPTTModel], metaclass=ModelManagerMeta):  # noqa: UP046
    # Properly implement equality checks so that lazy managers are properly compared
    def __eq__(self, other: object) -> bool:
        if not isinstance(other, type(self)):
            return NotImplemented
        return self._constructor_args == other._constructor_args  # type: ignore[attr-defined]

    # Copied from 'BaseManager.__hash__'
    def __hash__(self) -> int:
        return id(self)


# Serializable for GDPR


class SerializableModelManagerMixin:
    def serialize(self) -> list[dict[str, Any]]:
        return SerializableMixin.SerializableManager.serialize(self)  # type: ignore[arg-type]


class SerializableModelMixin:
    def serialize(self) -> list[dict[str, Any]]:
        return SerializableMixin.serialize(self)  # type: ignore[arg-type]
