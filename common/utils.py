from collections.abc import Sequence
from datetime import datetime, timedelta
from typing import Any, Literal

from django.conf import settings
from django.db import models
from modeltranslation.manager import get_translatable_fields_for_model

__all__ = [
    "comma_sep_str",
    "get_field_to_related_field_mapping",
    "get_nested",
    "get_translation_fields",
    "timedelta_from_json",
    "timedelta_to_json",
]


def get_nested(obj: dict | list | None, /, *args: str | int, default: Any = None) -> Any:
    """
    Get value from a nested structure containing dicts with string keys or lists,
    where the keys and list indices might not exist.

    1) `data["foo"][0]["bar"]["baz"]`
     - Might raise a `KeyError` or `IndexError` if any of the keys or indices don't exist.

    2) `get_nested(data, "foo", 0, "bar", "baz")`
     - Will return `None` (default) if any of the keys or indices don't exist.
    """
    if not args:
        return obj if obj is not None else default

    arg, args = args[0], args[1:]

    if isinstance(arg, int):
        obj = obj or []
        try:
            obj = obj[arg]
        except IndexError:
            obj = None
        return get_nested(obj, *args, default=default)

    obj = obj or {}
    return get_nested(obj.get(arg), *args, default=default)


def timedelta_to_json(delta: timedelta) -> str:
    return str(delta).zfill(8)


def timedelta_from_json(delta: str) -> timedelta:
    try:
        time_ = datetime.strptime(delta, "%H:%M:%S")
    except ValueError:
        time_ = datetime.strptime(delta, "%H:%M")

    return timedelta(hours=time_.hour, minutes=time_.minute, seconds=time_.second)


def comma_sep_str(values: Sequence[str]) -> str:
    """
    Return a comma separated string of the given values,
    with an ampersand before the last value:

    >>> comma_sep_str(["foo", "bar", "baz"])
    "foo, bar & baz"
    """
    if len(values) == 1:
        return str(values[0])
    return ", ".join(values[:-1]) + f" & {values[-1]}"


def get_field_to_related_field_mapping(model: type[models.Model]) -> dict[str, str]:
    """
    Mapping of all 'many_to_one' and 'many_to_many' fields
    on the given model to their related entity's field names.
    """
    return {
        field.name: field.remote_field.name  # many_to_one
        if isinstance(field.remote_field, models.ForeignKey)
        else field.remote_field.get_accessor_name()  # many_to_many
        for field in model._meta.get_fields()
        if field.is_relation and (field.many_to_many or field.one_to_many)
    }


def get_translation_fields(model: type[models.Model], fields: list[str] | Literal["__all__"]) -> list[str]:
    translatable_fields = get_translatable_fields_for_model(model) or []
    if fields == "__all__":
        fields = translatable_fields
    return [
        f"{field}_{language}" for field in translatable_fields for language, _ in settings.LANGUAGES if field in fields
    ]
