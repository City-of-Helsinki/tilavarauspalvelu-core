from typing import Any

import django_filters
from django.db.models import QuerySet
from django_filters.constants import EMPTY_VALUES


class CustomOrderingFilter(django_filters.OrderingFilter):
    """Ordering filter for handling custom 'order_by' filters."""

    def __init__(self, *args: Any, **kwargs: Any) -> None:
        self.custom_fields: dict[str, str] = self.normalize_fields(kwargs.pop("custom_fields", {}))
        super().__init__(*args, **kwargs)
        self.extra["choices"] += self.build_choices(self.custom_fields, {})

    def filter(self, qs: QuerySet, value: list[str]) -> QuerySet:
        if value in EMPTY_VALUES:
            return qs

        for item in value.copy():
            desc: bool = False
            if item.startswith("-"):
                item = item.removeprefix("-")
                desc = True

            if item not in self.custom_fields:
                continue

            value.remove(f"-{item}" if desc else item)
            qs = getattr(self, f"order_by_{item}")(qs, desc=desc)

        return super().filter(qs, value)
