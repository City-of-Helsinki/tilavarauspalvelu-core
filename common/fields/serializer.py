from __future__ import annotations

from typing import TYPE_CHECKING, Any

from django.utils.translation import gettext_lazy
from graphene_django_extensions.typing import AnyUser
from rest_framework import serializers
from rest_framework.relations import PKOnlyObject

if TYPE_CHECKING:
    from users.models import User


__all__ = [
    "CurrentUserDefaultNullable",
    "IntChoiceField",
    "IntegerPrimaryKeyField",
]


class IntPkOnlyObject(PKOnlyObject):
    """PK object that is coerced to an integer."""

    def __int__(self) -> int:
        return int(self.pk)


class IntegerPrimaryKeyField(serializers.PrimaryKeyRelatedField, serializers.IntegerField):
    """
    A field that refers to foreign keys by an integer primary key.
    If `common.serializers.BaseModelSerializer` is used, this field is automatically used for foreign keys.
    """

    def get_attribute(self, instance) -> IntPkOnlyObject | None:
        attribute = super().get_attribute(instance)
        if isinstance(attribute, PKOnlyObject) and attribute.pk:
            return IntPkOnlyObject(pk=attribute.pk)
        return None


class IntChoiceField(serializers.IntegerField):
    """
    Pairs with 'common.fields.model.IntChoiceField' to allow plain integers as choices in graphql endpoints.
    If `common.serializers.BaseModelSerializer` is used, this field is automatically used for
    model fields using `common.fields.model.IntChoiceField`.
    """

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


class CurrentUserDefaultNullable:
    """
    Get the current user from the request context. If the user is anonymous, return None.
    See: `rest_framework.fields.CurrentUserDefault`.
    """

    requires_context: bool = True

    def __call__(self, serializer_field: serializers.Field) -> User | None:
        user: AnyUser = serializer_field.context["request"].user
        if user.is_anonymous:
            return None
        return user

    def __repr__(self) -> str:
        return "%s()" % self.__class__.__name__
