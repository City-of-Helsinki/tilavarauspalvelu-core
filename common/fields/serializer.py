from typing import Any

from django.utils.translation import gettext_lazy
from rest_framework import serializers
from rest_framework.relations import PKOnlyObject

__all__ = [
    "IntChoiceField",
    "IntegerPrimaryKeyField",
]


class IntPkOnlyObject(PKOnlyObject):
    def __int__(self) -> int:
        return int(self.pk)


class IntegerPrimaryKeyField(serializers.PrimaryKeyRelatedField, serializers.IntegerField):
    """A field that refers to foreign keys by an integer primary key."""

    def get_attribute(self, instance) -> IntPkOnlyObject | None:
        attribute = super().get_attribute(instance)
        if isinstance(attribute, PKOnlyObject) and attribute.pk:
            return IntPkOnlyObject(pk=attribute.pk)
        return None


class IntChoiceField(serializers.IntegerField):
    """Pairs with 'common.fields.model.IntChoiceField' to allow plain integers as choices in graphql endpoints."""

    default_error_messages = serializers.IntegerField.default_error_messages | {
        "invalid_choice": gettext_lazy('"{input}" is not a valid choice.'),
    }

    def __init__(self, choices: list[tuple[int, str]], **kwargs: Any) -> None:
        self.choices = [val for val, _ in choices]
        super().__init__(**kwargs)

    def to_internal_value(self, data: int | str) -> int:
        data = super().to_internal_value(data)
        if data not in self.choices:
            self.fail("invalid_choice", input=data)
        return data
