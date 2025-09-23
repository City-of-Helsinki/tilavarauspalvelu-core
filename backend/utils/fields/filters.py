from __future__ import annotations

from typing import TYPE_CHECKING, Any

import django_filters

from utils.fields.forms import TextChoicesFormField, TextMultipleChoiceFormField, TimezoneAwareDateField

if TYPE_CHECKING:
    from django.db import models


__all__ = [
    "TextChoiceFilter",
    "TextMultipleChoiceFilter",
]


class TimezoneAwareDateFilter(django_filters.DateFilter):
    """
    DateFilter that allows filtering by date on datetime fields.

    This is useful when you want to filter by date on a DateTimeField in the local timezone.
    The default DateFilter always uses the UTC timezone, which can lead to unexpected results.
    """

    field_class = TimezoneAwareDateField


class TextChoiceFilterMixin:
    def __init__(self, enum: type[models.TextChoices], *args: Any, **kwargs: Any) -> None:
        kwargs["enum"] = enum
        kwargs["choices"] = enum.choices
        super().__init__(*args, **kwargs)


class TextChoiceFilter(TextChoiceFilterMixin, django_filters.TypedChoiceFilter):
    """Custom field for handling enums better in GraphQL filters."""

    field_class = TextChoicesFormField


class TextMultipleChoiceFilter(TextChoiceFilterMixin, django_filters.TypedMultipleChoiceFilter):
    """Same as above but supports multiple choices."""

    field_class = TextMultipleChoiceFormField
