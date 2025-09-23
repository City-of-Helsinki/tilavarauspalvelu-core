from __future__ import annotations

from typing import TYPE_CHECKING, Any

from rest_framework.fields import SkipField

if TYPE_CHECKING:
    from graphene_django_extensions.typing import AnyUser
    from rest_framework import serializers
    from rest_framework.fields import Field

    from tilavarauspalvelu.models import User

__all__ = [
    "CurrentUserDefaultNullable",
    "input_only_field",
]


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
        return f"{self.__class__.__name__}()"


def input_only_field(value: Any, field: Field) -> None:
    """
    This is a bit of a hack, but adding this validator to any ModelSerializer field
    will exclude that field from `validated_data`. This can be used to create fields
    that are only used for input, but not saved on the model. The value for the field
    is still present in the `initial_data` attribute of the serializer, and will be run
    through the `to_internal_value` method of the field. The internal value is then saved
    to `initial_data`.

    Note that you should not set a `default` value for the field, or this will not work.
    Instead, use `self.initial_data.get(<field_name>, <default_value>)` for default values.
    Additionally, fields should be marked as `write_only=True` to prevent them from being
    serialized in responses.
    """
    field.parent.initial_data[field.field_name] = value  # Save the validated value
    raise SkipField


input_only_field.requires_context = True  # See. `rest_framework.fields.Field.run_validators`
