from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

if TYPE_CHECKING:
    from django import forms

__all__ = [
    "IntChoiceField",
    "StrChoiceField",
]


class StrChoiceField(models.CharField):
    """CharField for TextChoices that automatically sets 'max_length' to the length of the longest choice."""

    def __init__(self, enum: type[models.Choices], **kwargs: Any) -> None:
        self.enum = enum
        kwargs["max_length"] = max(len(val) for val, _ in enum.choices)
        kwargs["choices"] = enum.choices
        super().__init__(**kwargs)

    def deconstruct(self) -> tuple[str, str, list[Any], dict[str, Any]]:
        name, path, args, kwargs = super().deconstruct()
        kwargs["enum"] = self.enum
        return name, path, args, kwargs


class IntChoiceField(models.IntegerField):
    """
    IntegerField for IntegerChoices that sets 'min_value' and 'max_value' validators
    instead of regular choice validation. Useful when you don't want integer choices to be
    converted to strings in graphql endpoints (ref: `graphene_django.converter.convert_choice_name`).
    Pair with `common.fields.serializer.IntChoiceField` to validate choices in serializers.
    """

    def __init__(self, enum: type[models.Choices], **kwargs: Any) -> None:
        self.enum = enum

        min_value = int(min(val for val, _ in enum.choices))
        max_value = int(max(val for val, _ in enum.choices))
        msg = f"Value must be between {min_value} and {max_value}."
        # These validators are passed to the serializer field as its 'min_value' and 'max_value'.
        kwargs["validators"] = [
            MinValueValidator(limit_value=min_value, message=msg),
            MaxValueValidator(limit_value=max_value, message=msg),
        ]
        super().__init__(**kwargs)

    def deconstruct(self) -> tuple[str, str, list[Any], dict[str, Any]]:
        name, path, args, kwargs = super().deconstruct()
        kwargs["enum"] = self.enum
        return name, path, args, kwargs

    def validate(self, value: int | None, model_instance: models.Model) -> None:
        original_choices = self.choices
        try:
            self.choices = self.enum.choices
            super().validate(value, model_instance)
        finally:
            self.choices = original_choices

    def formfield(self, **kwargs: Any) -> forms.IntegerField:
        original_choices = self.choices
        try:
            self.choices = self.enum.choices
            choices = super().formfield(**kwargs)
        finally:
            self.choices = original_choices

        return choices


class DurationSeconds(models.Transform):  # pragma: no cover
    """Transform interval to integer seconds."""

    function = "EXTRACT"
    lookup_name = "seconds"
    template = "%(function)s(EPOCH FROM %(expressions)s)"
    output_field = models.IntegerField()


class InRange(models.Lookup):  # pragma: no cover
    """
    Lookup for checking if a value is in a given range. Takes a range(<int>, <int>, <int>) as input,
    but unlike range, the end value is inclusive as well!
    """

    lookup_name = "in_range"
    prepare_rhs = False

    def get_db_prep_lookup(self, value: range, connection) -> tuple[str, list[int]]:  # noqa: ARG002 ANN001
        return "%s, %s, %s", [value.start, value.stop, value.step]

    def as_sql(self, compiler, connection) -> tuple[str, list]:  # noqa: ANN001
        _, lhs_params = self.process_lhs(compiler, connection)
        _, rhs_params = self.process_rhs(compiler, connection)
        params = lhs_params + rhs_params
        return "%s in (SELECT num FROM generate_series(%s, %s, %s) as num)", params


models.IntegerField.register_lookup(InRange)
models.DurationField.register_lookup(DurationSeconds)
