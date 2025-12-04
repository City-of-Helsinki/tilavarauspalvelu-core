from __future__ import annotations

from typing import Any, Literal, Self

from django.db import models
from django.db.models import QuerySet
from django.db.models.manager import BaseManager
from mptt.managers import TreeManager
from mptt.querysets import TreeQuerySet

from utils.db import CoalesceEmpty

__all__ = [
    "ManyToManyRelatedManager",
    "ModelManager",
    "ModelQuerySet",
    "ModelTreeManager",
    "ModelTreeQuerySet",
    "OneToManyRelatedManager",
    "TranslatedModelQuerySet",
]


# Normal models


class ModelQuerySet(QuerySet):
    """QuerySet class that offers better typing than a regular QuerySet."""


class TranslatedModelQuerySet(QuerySet):
    def annotate_fallback_translation(self, *, field: str) -> Self:
        """
        Annotate a field in the given language, falling back to Finnish if the translation is empty.

        Example:
            qs = qs.annotate_fallback_translation(field="name_en")
            qs[0].name_en_translated  # Will be "name_en" if not empty, otherwise "name_fi"
        """
        base_field_name = field[:-3]  # name_en -> name
        language = field[-2:]  # name_en -> en
        return self.annotate(**{
            f"{field}_translated": CoalesceEmpty(
                models.F(f"{base_field_name}_{language}"),
                models.F(f"{base_field_name}_fi"),
                output_field=models.CharField(),
            )
        })

    def order_by_translated(self, *, field: str, language: Literal["en", "sv"], desc: bool = False) -> Self:
        """Order by field in the given language, falling back to Finnish if the field in the given language is empty."""
        return self.order_by(
            models.OrderBy(
                CoalesceEmpty(models.F(f"{field}_{language}"), models.F(f"{field}_fi")),
                descending=desc,
            )
        )


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
