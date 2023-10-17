from typing import Any

import graphene
from django import forms
from django.db import models
from graphene_django.forms.converter import convert_form_field, get_form_field_description

__all__ = [
    "IntChoiceField",
    "IntMultipleChoiceField",
    "EnumChoiceField",
    "EnumMultipleChoiceField",
]


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
    """Allow plain integers as choices."""


class IntMultipleChoiceField(IntChoiceMixin, forms.TypedMultipleChoiceField):
    pass


class EnumChoiceField(forms.ChoiceField):
    def __init__(self, enum: type[models.Choices], **kwargs: Any) -> None:
        self.enum = enum
        kwargs["choices"] = enum.choices
        super().__init__(**kwargs)


class EnumMultipleChoiceField(forms.MultipleChoiceField):
    def __init__(self, enum: type[models.Choices], **kwargs: Any) -> None:
        self.enum = enum
        kwargs["choices"] = enum.choices
        super().__init__(**kwargs)


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
