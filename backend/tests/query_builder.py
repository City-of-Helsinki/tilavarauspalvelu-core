from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from enum import Enum
from itertools import chain
from typing import Any, NamedTuple

from django.db.models import lookups
from django.db.models.constants import LOOKUP_SEP

__all__ = [
    "build_mutation",
    "build_query",
]

from undine.settings import undine_settings
from undine.utils.text import to_camel_case

from utils.utils import get_nested


class FiltersAndFields(NamedTuple):
    query_filters: str
    fields: str


@dataclass
class FieldFilterParams:
    filters: list[str] = field(default_factory=list)
    sub_filters: dict[str, FieldFilterParams] = field(default_factory=dict)

    def __str__(self) -> str:
        return f"({', '.join(self.filters)})"


KNOWN_LOOKUP_FIELDS: set[str] = {
    val.lookup_name
    for val in chain(
        lookups.__dict__.values(),
    )
    if getattr(val, "lookup_name", None) is not None
}


def build_query(__name: str, *, fields: str = "pk", connection: bool = False, **filter_params: Any) -> str:  # noqa: PYI063
    """
    Build a GraphQL query with the given field selections and filter parameters.

    :param __name: Name of the query entrypoint, in camelCase.
    :param fields: Field selections as a GraphQL string.
    :param connection: Whether to build a Relay Connection query or basic one.
    :param filter_params: Parameters to use in the query. Will be converted to camelCase.
                          Use "__" to add filters to fields instead of the query.
    """
    result = _build_filters(fields, **filter_params)
    fields = f"edges {{ node {{ {result.fields} }} }}" if connection else result.fields
    return f"query {{ {__name}{result.query_filters} {{ {fields} }} }}"


def build_mutation(__name: str, __mutation_class_name: str, *, fields: str = "pk") -> str:  # noqa: PYI063
    """
    Build a GraphqQL mutation with the given field selections.

    :param __name: Name of the mutation entrypoint, in camelCase.
    :param __mutation_class_name: Name of the MutationType.
    :param fields: Field selections as a GraphQL string.
    """
    return f"mutation ($input: {__mutation_class_name}!) {{ {__name}(input: $input) {{ {fields} }} }}"


def _build_filters(fields: str, /, **params: Any) -> FiltersAndFields:
    """
    Build GrpahQL filters for the query and fields based on given params.

    >>> _build_filters("foo bar { fizz buzz }", one=1, foo__two=2, bar__three=3)
    FiltersAndFields(query_filters="(one: 1)", fields="foo(two: 2) bar(three: 3) { fizz buzz }")
    """
    filter_params: dict[str, Any] = {}
    order_by: str = ""

    field_filter_params: dict[str, Any] = {}

    for key, value in params.items():
        name = to_camel_case(key)

        if len(name.split(LOOKUP_SEP)) > 1:
            field_filter_params[key] = value

        elif name == undine_settings.QUERY_TYPE_ORDER_INPUT_KEY:
            order_by = _format_order_by_value(value)

        else:
            filter_params[name] = _format_value_for_filter(value)

    filters: str = ""
    if filter_params:
        ftr = ", ".join(f"{key}: {value}" for key, value in filter_params.items())
        filters = f"{undine_settings.QUERY_TYPE_FILTER_INPUT_KEY}: {{{ftr}}}"

    ordering: str = ""
    if order_by:
        ordering = f"{undine_settings.QUERY_TYPE_ORDER_INPUT_KEY}: {order_by}"

    query_filters = f"{filters} {ordering}".strip()
    if query_filters:
        query_filters = f"({query_filters})"

    if field_filter_params:
        field_dict = _fields_to_dict(fields)
        field_filters = _build_field_filter_params(field_filter_params)
        fields = _add_filters_to_fields(field_dict, field_filters)

    return FiltersAndFields(query_filters=query_filters, fields=fields)


def _format_order_by_value(value: Any) -> str:
    if isinstance(value, list):
        return f"[{', '.join(item for item in value)}]"
    return value


def _format_value_for_filter(value: Any) -> str:
    """Format values for the GraphQL filters. For enums, use the enum value. Otherwise, format as json."""
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, list) and all(isinstance(item, Enum) for item in value):
        return f"[{', '.join(str(item.value) for item in value)}]"
    if isinstance(value, uuid.UUID):
        value = str(value)
    return json.dumps(value)


def _build_field_filter_params(field_filter_params: dict[str, Any]) -> dict[str, FieldFilterParams]:
    """
    Convert field filters

    >>> _build_field_filter_params({"foo__bar": 1, "foo__baz": 2, "foo__fizz__buzz": 4, "other__thing": "value"})
    {
        "foo": FieldFilterParams(
            filters=['bar: 1', 'baz: 2'],
            sub_filters={
                "fizz": FieldFilterParams(
                    filters=['buzz: 4'],
                    sub_filters=[],
                )
            },
        ),
        "other": FieldFilterParams(
            filters=['thing: "value"'],
            sub_filters=[],
        ),
    }
    """
    params: dict[str, FieldFilterParams] = {}

    for key, value in field_filter_params.items():
        parts = key.split(LOOKUP_SEP)

        last_index = len(parts) - 1
        current_params = params.setdefault(to_camel_case(parts[0]), FieldFilterParams())

        for i, part in enumerate(parts[1:], start=1):
            if i != last_index:
                sub_params = current_params.sub_filters.setdefault(to_camel_case(part), FieldFilterParams())
                current_params = sub_params
                continue

            current_params.filters.append(f"{to_camel_case(part)}: {_format_value_for_filter(value)}")

    return params


def _add_filters_to_fields(fields: dict[str, dict | None], field_filter_params: dict[str, FieldFilterParams]) -> str:
    """
    Add field filters to fields and build into a GraphQL fields select string.

    >>> a = {"foo": {"bar": None}}
    >>> b = {"foo": FieldFilterParams(filters=["filter: 1"])
    >>> _add_filters_to_fields(fields=a, field_filter_params=b)
    "foo(filter: 1) { bar }"
    """
    for field_name, params in field_filter_params.items():
        if field_name not in fields:
            msg = (
                f"Field filters '{params}' defined for field '{field_name}' "
                f"but not in selected fields: '{_dict_to_fields(fields)}'"
            )
            raise RuntimeError(msg)

        if params.sub_filters:
            _add_filters_to_fields(fields=fields[field_name] or {}, field_filter_params=params.sub_filters)

        filters = ""
        if params.filters:
            ftr = ", ".join(params.filters)
            filters = f"({undine_settings.QUERY_TYPE_FILTER_INPUT_KEY}: {{{ftr}}})"

        fields[f"{field_name}{filters}"] = fields.pop(field_name)

    return _dict_to_fields(fields)


def _fields_to_dict(fields: str) -> dict[str, dict | None]:
    """
    Convert a GraphQL fields select string into a dict describing the selections.

    >>> _fields_to_dict("foo bar { baz }")
    {"foo": None, "bar": {"baz": None}}
    """
    fields_dict = current_dict = {}
    parents: list[str] = []
    previous_field: str = ""

    for field_name in (val for val in fields.replace("\n", "").split(" ") if val != ""):
        if field_name == "{":
            parents.append(previous_field)
            current_dict[previous_field] = current_dict = {}
        elif field_name == "}":
            parents.pop()
            current_dict = get_nested(fields_dict, *parents, default={})
        elif any(val in field_name for val in ("{", "}")):
            msg = f"Should include a space before or after the '{{' and/or '}}' characters: '{field_name}'"
            raise RuntimeError(msg)
        else:
            current_dict[to_camel_case(field_name)] = None

        previous_field = field_name

    return fields_dict


def _dict_to_fields(fields: dict[str, dict | None]) -> str:
    """
    Reverse of `field_filters` above.

    >>> _dict_to_fields({"foo": None, "bar": {"baz": None}})
    "foo bar { baz }"
    """
    return " ".join(key if value is None else f"{key} {{ {_dict_to_fields(value)} }}" for key, value in fields.items())
