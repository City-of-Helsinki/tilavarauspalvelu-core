from collections.abc import Generator, Sequence
from typing import Any, Generic, Literal, TypeVar

from django.db import models
from modeltranslation.manager import get_translatable_fields_for_model

__all__ = [
    "comma_sep_str",
    "get_attr_by_language",
    "get_field_to_related_field_mapping",
    "get_nested",
    "get_translation_fields",
    "with_indices",
]

from tilavarauspalvelu.utils.commons import Language

T = TypeVar("T")


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
    return [f"{field}_{language}" for field in translatable_fields for language in Language.values if field in fields]


class with_indices(Generic[T]):  # noqa: N801, RUF100
    """
    Iterate list items with indexes in a way that is safe for deletion.
    This can be used as a deletion safe replacement for `enumerate()`.

    When deleting items, must set the `item_deleted` attribute to `True`.
    Only one item can be deleted per iteration.

    >>> items = [1, 2, 2, 3, 4, 5, 5, 6, 8, 7]
    >>> for i, item in (gen := with_indices(items)):
    ...    if item % 2 == 0:
    ...        del items[i]
    ...        # Set when item has been deleted.
    ...        gen.item_deleted = True
    ...    if item % 3 == 0:
    ...        # Added items will be handled at the end
    ...        items.append(10)
    ...
    >>> items
    [1, 3, 5, 5, 7]
    """

    def __init__(self, _seq: list[T], /) -> None:
        self.seq = _seq
        self.item_deleted: bool = False

    def __iter__(self) -> Generator[tuple[int, T], None, None]:
        i: int = 0
        next_item: T = None
        gen = enumerate(self.seq)
        while True:
            if next_item is not None:
                item = next_item
                next_item = None
                yield i, item

            else:
                try:
                    i, item = next(gen)
                except StopIteration:
                    return

                yield i, item

            if self.item_deleted:
                self.item_deleted = False
                try:
                    next_item = self.seq[i]
                except IndexError:  # last item was deleted, exit
                    return

    def delete_item(self, i: int) -> None:
        del self.seq[i]
        self.item_deleted = True


def get_attr_by_language(instance: Any, field: str, language: str) -> str | None:
    """Get field value by language, or fallback to default language"""
    localised_value = getattr(instance, f"{field}_{language}", None)
    if localised_value:
        return localised_value
    return getattr(instance, field, None)
