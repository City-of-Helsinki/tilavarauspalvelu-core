from __future__ import annotations

from typing import Any

from django.db.models import QuerySet
from django.db.models.manager import BaseManager
from mptt.managers import TreeManager
from mptt.querysets import TreeQuerySet

__all__ = [
    "ManyToManyRelatedManager",
    "ModelManager",
    "ModelQuerySet",
    "ModelTreeManager",
    "ModelTreeQuerySet",
    "OneToManyRelatedManager",
]


# Normal models


class ModelQuerySet(QuerySet):
    """QuerySet class that offers better typing than a regular QuerySet."""


class ModelManager(BaseManager):
    """
    Manager class that offers better typing than a regular Manager.
    Type hints can be added by subclassing `ModelManager[MyModel, MyModelQuerySet]`.
    """

    def __class_getitem__(cls, item: Any) -> Any:
        # When subclassing like this:
        #
        # >>> class MyManager(ModelManager[MyModel, MyModelQuerySet]): ...
        #
        # The method is called with the generic arguments as a tuple.
        # Save the queryset class to use in `__init_subclass__`.
        ModelManager.__queryset_class__ = item[1]
        return cls  # type: ignore[return-value]

    def __init_subclass__(cls, **kwargs: Any) -> None:
        # If subclassed like this:
        #
        # >>> class MyManager(ModelManager[MyModel, MyModelQuerySet]): ...
        #
        # The queryset class is saved to `ModelManager.__queryset_class__`
        # in `__class_getitem__`. Use this to add the queryset methods
        # to the manager class.
        if hasattr(ModelManager, "__queryset_class__"):
            queryset_class: type[ModelQuerySet] = ModelManager.__queryset_class__
            del ModelManager.__queryset_class__

            cls._queryset_class = queryset_class
            methods = BaseManager._get_queryset_methods(queryset_class)  # noqa: SLF001
            for name, method in methods.items():
                setattr(cls, name, method)

    def __eq__(self, other: object) -> bool:
        # Properly implement equality checks so that lazy managers are properly compared
        if not isinstance(other, type(self)):
            return NotImplemented
        return self._constructor_args == other._constructor_args  # type: ignore[attr-defined]

    def __hash__(self) -> int:
        # Copied from 'BaseManager.__hash__'
        return id(self)


# Related managers


class OneToManyRelatedManager(ModelManager): ...


class ManyToManyRelatedManager(ModelManager): ...


# MPTT models


class ModelTreeQuerySet(TreeQuerySet):
    """TreeQuerySet class that offers better typing than a regular TreeQuerySet."""


class ModelTreeManager(TreeManager):
    """
    TreeManager class that offers better typing than a regular TreeManager.
    Type hints can be added by subclassing `ModelTreeManager[MyTreeModel, MyModelTreeQuerySet]`.
    """

    def __class_getitem__(cls, item: Any) -> Any:
        # When subclassing like this:
        #
        # >>> class MyManager(ModelTreeManager[MyTreeModel, MyModelTreeQuerySet]): ...
        #
        # The method is called with the generic arguments as a tuple.
        # Save the queryset class to use in `__init_subclass__`.
        ModelTreeManager.__queryset_class__ = item[1]
        return cls  # type: ignore[return-value]

    def __init_subclass__(cls, **kwargs: Any) -> None:
        # If subclassed like this:
        #
        # >>> class MyManager(ModelTreeManager[MyModel, MyModelTreeQuerySet]): ...
        #
        # The queryset class is saved to `ModelTreeManager.__queryset_class__`
        # in `__class_getitem__`. Use this to add the queryset methods
        # to the manager class.
        if hasattr(ModelTreeManager, "__queryset_class__"):
            queryset_class: type[ModelTreeQuerySet] = ModelTreeManager.__queryset_class__
            del ModelTreeManager.__queryset_class__

            cls._queryset_class = queryset_class
            methods = BaseManager._get_queryset_methods(queryset_class)  # noqa: SLF001
            for name, method in methods.items():
                setattr(cls, name, method)

    def __eq__(self, other: object) -> bool:
        # Properly implement equality checks so that lazy managers are properly compared
        if not isinstance(other, type(self)):
            return NotImplemented
        return self._constructor_args == other._constructor_args  # type: ignore[attr-defined]

    def __hash__(self) -> int:
        # Copied from 'BaseManager.__hash__'
        return id(self)
