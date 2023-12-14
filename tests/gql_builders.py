import json
from dataclasses import dataclass, field
from enum import Enum
from itertools import chain
from typing import Any, NamedTuple

from django.contrib.postgres import lookups as pg_lookups
from django.db.models import lookups
from django.db.models.constants import LOOKUP_SEP
from graphene.utils.str_converters import to_camel_case

from common.utils import get_nested

__all__ = [
    "build_query",
    "build_mutation",
]


class FiltersAndFields(NamedTuple):
    query_filters: str
    fields: str


@dataclass
class FieldFilterParams:
    filters: list[str] = field(default_factory=list)
    sub_filters: dict[str, "FieldFilterParams"] = field(default_factory=dict)


KNOWN_LOOKUP_FIELDS: set[str] = {
    val.lookup_name
    for val in chain(
        lookups.__dict__.values(),
        pg_lookups.__dict__.values(),
    )
    if getattr(val, "lookup_name", None) is not None
}


def build_query(__name: str, *, fields: str = "pk", connection: bool = False, **filter_params: Any) -> str:
    """
    Build a GraphQL query with the given field selections and filter parameters.

    :param __name: Name of the QueryObject the query is for, e.g., `applicationEvents`.
    :param fields: Field selections as a GraphQL string.
    :param connection: Whether to build a Relay connection query or basic one.
    :param filter_params: Parameters to use in the query. Will be converted to camelCase.
                          Use "__" to add filters to fields instead of the query.
    """
    result = _build_filters(fields, **filter_params)
    fields = f"edges {{ node {{ {result.fields} }} }}" if connection else result.fields
    return f"query {{ {__name}{result.query_filters} {{ {fields} }} }}"


def build_mutation(name: str, input_name: str, selections: str = "pk errors { messages field }") -> str:
    """
    Build a GraphqQL mutation with the given field selections.

    :param name: Name of the QueryObject the mutation is for, e.g., `createApplicationEvent`.
    :param input_name: Name of the mutation input object, e.g., `ApplicationEventCreateMutationInput`.
    :param selections: Field selections as a GraphQL string.
    """
    return f"mutation {name}($input: {input_name}!) {{ {name}(input: $input) {{ {selections} }} }}"


def _build_filters(fields: str, /, **filter_params: Any) -> FiltersAndFields:
    """
    Build GrpahQL filters for the query and fields based on given params.

    >>> _build_filters("foo bar { fizz buzz }", one=1, foo__two=2, bar__three=3)
    FiltersAndFields(query_filters="(one: 1)", fields="foo(two: 2) bar(three: 3) { fizz buzz }")
    """
    params: dict[str, Any] = {}
    field_filter_params: dict[str, Any] = {}
    for key, value in filter_params.items():
        plain_key, _ = _split_lookups(key)
        if len(plain_key.split(LOOKUP_SEP)) > 1:
            field_filter_params[key] = value
        else:
            params[to_camel_case(key)] = _format_value_for_filter(value)

    query_filters: str = ""
    if params:
        query_filters = f"({', '.join(f'{key}: {value}' for key, value in params.items())})"
    if field_filter_params:
        field_dict = _fields_to_dict(fields)
        field_filters = _build_field_filter_params(field_filter_params)
        fields = _add_filters_to_fields(field_dict, field_filters)

    return FiltersAndFields(query_filters=query_filters, fields=fields)


def _split_lookups(key: str) -> tuple[str, str]:
    """
    Split known lookup fields from the given filter key.

    >>> _split_lookups("foo__bar__istartswith")
    ("foo__bar", "istartswith")
    >>> _split_lookups("foo__bar__baz")
    ("foo__bar__baz", "")
    """
    plain_key = key
    for lookup_field in KNOWN_LOOKUP_FIELDS:
        plain_key = plain_key.removesuffix(f"{LOOKUP_SEP}{lookup_field}")
        if plain_key != key:
            return plain_key, lookup_field
    return plain_key, ""


def _format_value_for_filter(value: Any) -> str:
    """Format values for the GraphQL filters. For enums, use the enum value. Otherwise, format as json."""
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, list) and all(isinstance(item, Enum) for item in value):
        return f"[{', '.join(str(item.value) for item in value)}]"
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
        plain_key, lookup_field = _split_lookups(key)
        parts = plain_key.split(LOOKUP_SEP)
        last_index = len(parts) - 1
        current_params = params.setdefault(to_camel_case(parts[0]), FieldFilterParams())

        for i, part in enumerate(parts[1:], start=1):
            if i != last_index:
                sub_params = current_params.sub_filters.setdefault(to_camel_case(part), FieldFilterParams())
                current_params = sub_params
                continue

            if lookup_field:
                part = f"{part}{LOOKUP_SEP}{lookup_field}"

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
            msg = f"Field filters '{params}' defined for field '{field_name}' but not in selected fields: {fields}"
            raise RuntimeError(msg)

        if params.sub_filters:
            _add_filters_to_fields(fields=fields[field_name] or {}, field_filter_params=params.sub_filters)

        filters = f"({', '.join(params.filters)})" if params.filters else ""
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
