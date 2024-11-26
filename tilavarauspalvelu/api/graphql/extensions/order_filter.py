from __future__ import annotations

from typing import TYPE_CHECKING, Protocol

import django_filters
from django_filters.constants import EMPTY_VALUES

if TYPE_CHECKING:
    from django.db.models import QuerySet


class OrderingFunc(Protocol):
    def __call__(self, qs: QuerySet, *, desc: bool) -> QuerySet:
        """Custom ordering function."""


class CustomOrderingFilter(django_filters.OrderingFilter):
    """
    Ordering filter for handling custom orderings by defining `order_by_{name}`
    functions on its subclasses or filtersets that include the filter.
    """

    def filter(self, qs: QuerySet, value: list[str]) -> QuerySet:
        if value in EMPTY_VALUES:
            return qs

        ordering: list[str] = list(qs.query.order_by)
        for param in value:
            if param in EMPTY_VALUES:
                continue

            func_name = f"order_by_{param.removeprefix('-')}"

            # Try to find an `ordering_func` on the `OrderingFilter` class or its `FilterSet` class.
            ordering_func: OrderingFunc | None = getattr(self, func_name, None)
            if ordering_func is None and hasattr(self, "parent"):
                ordering_func = getattr(self.parent, func_name, None)

            # If no `ordering_func` was found, just order by the given field name.
            if ordering_func is None or not callable(ordering_func):
                ordering.append(self.get_ordering_value(param))
                continue

            qs = ordering_func(qs, desc=param.startswith("-"))
            # Save the order_by value wince the last `qs.order_by(*ordering)`
            # will clear all ordering when set called.
            ordering.extend(qs.query.order_by)

        return qs.order_by(*ordering)
