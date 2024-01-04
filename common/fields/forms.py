from typing import Any

import graphene
from django import forms
from django.contrib import admin
from django.contrib.admin.widgets import AutocompleteSelectMultiple, FilteredSelectMultiple
from django.db import models
from django.db.models import ManyToManyField
from django.forms import ModelMultipleChoiceField
from graphene_django.forms.converter import convert_form_field, get_form_field_description

__all__ = [
    "IntChoiceField",
    "IntMultipleChoiceField",
    "EnumChoiceField",
    "EnumMultipleChoiceField",
    "disabled_widget",
]

disabled_widget = forms.TextInput(attrs={"class": "readonly", "disabled": True, "required": False})


class ModelMultipleChoiceFilteredField(ModelMultipleChoiceField):
    def __init__(self, queryset: models.QuerySet, *, is_stacked: bool = False, **kwargs: Any) -> None:
        """
        Model multiple choice field with filtered select widget.

        :param queryset: The queryset to use for the filtered select widget.
        :param is_stacked: Whether to use a stacked or horizontal filtered select widget.
        """
        kwargs["widget"] = FilteredSelectMultiple(queryset.model._meta.verbose_name_plural, is_stacked=is_stacked)
        super().__init__(queryset, **kwargs)


class ModelMultipleChoiceAutocompleteField(ModelMultipleChoiceField):
    def __init__(self, queryset: models.QuerySet, *, field: ManyToManyField, **kwargs: Any) -> None:
        """
        Model multiple choice field with autocomplete widget.

        :param queryset: The queryset to use for the autocomplete widget.
        :param field: The field to use for the autocomplete widget. e.g. `UnitGroup.units.field`.
        """
        kwargs["widget"] = AutocompleteSelectMultiple(field, admin_site=admin.site)
        super().__init__(queryset, **kwargs)


class IntChoiceMixin:
    def __init__(self: forms.ChoiceField, **kwargs: Any) -> None:
        kwargs["coerce"] = int
        super().__init__(**kwargs)

    def valid_value(self: forms.ChoiceField, value: Any) -> bool:
        if self.choices:
            return super().valid_value(value)
        try:
            self.coerce(value)
        except (ValueError, TypeError):
            return False
        return True


class IntChoiceField(IntChoiceMixin, forms.TypedChoiceField):
    """
    Allow plain integers as choices in GraphQL filters
    (see `common.fields.model.IntChoiceField` for motivation).
    Supports a single choice.

    This needs to be registered to graphene form field converters
    so that when `common.filtersets.IntChoiceFilter` is used,
    graphene-django knows how to convert the filter to a graphene field.
    """


class IntMultipleChoiceField(IntChoiceMixin, forms.TypedMultipleChoiceField):
    """Same as `common.fields.forms.IntChoiceField` above but supports multiple choices."""


class EnumChoiceField(forms.ChoiceField):
    """
    Custom field for handling enums better in GraphQL filters.
    Supports a single choice.

    Using the regular `django_filters.ChoiceFilter` (which uses `forms.ChoiceField` under the hood)
    causes the enum choices to be converted to strings in GraphQL filters.
    Using `common.filtersets.EnumChoiceFilter` (which uses this field under the hood)
    uses GraphQL enums instead, which gives better autocomplete results.
    """

    def __init__(self, enum: type[models.Choices], **kwargs: Any) -> None:
        self.enum = enum
        kwargs["choices"] = enum.choices
        super().__init__(**kwargs)


class EnumMultipleChoiceField(forms.MultipleChoiceField):
    """Same as `common.fields.forms.EnumChoiceField` above but supports multiple choices."""

    def __init__(self, enum: type[models.Choices], **kwargs: Any) -> None:
        self.enum = enum
        kwargs["choices"] = enum.choices
        super().__init__(**kwargs)


# Register the custom form fields to graphene form field converters.
# This way we get the appropriate schema types when these fields are used in filters.


@convert_form_field.register(IntChoiceField)
def convert_form_field_to_int(field):
    return graphene.Int(description=get_form_field_description(field), required=field.required)


@convert_form_field.register(IntMultipleChoiceField)
def convert_form_field_to_list_of_int(field):
    return graphene.List(graphene.Int, description=get_form_field_description(field), required=field.required)


@convert_form_field.register(EnumChoiceField)
def convert_form_field_to_enum(field):
    return graphene.Enum.from_enum(field.enum)(
        description=get_form_field_description(field),
        required=field.required,
    )


@convert_form_field.register(EnumMultipleChoiceField)
def convert_form_field_to_enum_list(field):
    return graphene.List(
        graphene.Enum.from_enum(field.enum),
        description=get_form_field_description(field),
        required=field.required,
    )
