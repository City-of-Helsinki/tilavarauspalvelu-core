from typing import Any

import django_filters
from django.db import models
from django_filters.filterset import FILTER_FOR_DBFIELD_DEFAULTS

from common.fields.forms import EnumChoiceField, EnumMultipleChoiceField, IntChoiceField, IntMultipleChoiceField

__all__ = [
    "BaseModelFilterSet",
    "IntChoiceFilter",
    "IntMultipleChoiceFilter",
    "EnumChoiceFilter",
    "EnumMultipleChoiceFilter",
]


class IntChoiceFilter(django_filters.TypedChoiceFilter):
    """
    Allow plain integers as choices in GraphQL filters.
    See `common.fields.forms.IntChoiceField` for motivation.
    """

    field_class = IntChoiceField


class IntMultipleChoiceFilter(django_filters.TypedMultipleChoiceFilter):
    """Same as `common.filtersets.IntChoiceFilter` above but supports multiple choices."""

    field_class = IntMultipleChoiceField


class EnumChoiceFilter(django_filters.TypedChoiceFilter):
    """
    Custom field for handling enums better in GraphQL filters.
    See `common.fields.forms.EnumChoiceField` for motivation.
    """

    field_class = EnumChoiceField

    def __init__(self, enum: type[models.Choices], *args: Any, **kwargs: Any) -> None:
        kwargs["enum"] = enum
        kwargs["choices"] = enum.choices
        super().__init__(*args, **kwargs)


class EnumMultipleChoiceFilter(django_filters.TypedMultipleChoiceFilter):
    """Same as `common.filtersets.EnumChoiceFilter` above but supports multiple choices."""

    field_class = EnumMultipleChoiceField

    def __init__(self, enum: type[models.Choices], *args: Any, **kwargs: Any) -> None:
        kwargs["enum"] = enum
        kwargs["choices"] = enum.choices
        super().__init__(*args, **kwargs)


class BaseModelFilterSet(django_filters.FilterSet):
    FILTER_DEFAULTS = FILTER_FOR_DBFIELD_DEFAULTS
    # Change the default filters for all relationships to not make
    # a database query to check if a corresponding row exists.
    FILTER_DEFAULTS[models.ForeignKey] = {"filter_class": IntChoiceFilter}
    FILTER_DEFAULTS[models.OneToOneField] = {"filter_class": IntChoiceFilter}
    FILTER_DEFAULTS[models.ManyToManyField] = {"filter_class": IntMultipleChoiceFilter}
    FILTER_DEFAULTS[models.OneToOneRel] = {"filter_class": IntChoiceFilter}
    FILTER_DEFAULTS[models.ManyToOneRel] = {"filter_class": IntMultipleChoiceFilter}
    FILTER_DEFAULTS[models.ManyToManyRel] = {"filter_class": IntMultipleChoiceFilter}
