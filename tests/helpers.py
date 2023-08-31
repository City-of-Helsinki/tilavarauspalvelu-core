import json
from collections import defaultdict
from typing import Any, NamedTuple, Self, TypedDict, TypeVar

__all__ = [
    "GraphQLClient",
    "load_content",
    "parametrize_helper",
]

from django.test import Client
from graphene_django.utils.testing import graphql_query

TNamedTuple = TypeVar("TNamedTuple", bound=NamedTuple)


class GraphQLClient(Client):
    def __call__(
        self: Self,
        query: str,
        operation_name: str | None = None,
        input_data: dict[str, Any] | None = None,
        variables: dict[str, Any] | None = None,
        headers: dict[str, Any] | None = None,
    ):
        return graphql_query(
            query=query,
            operation_name=operation_name,
            input_data=input_data,
            variables=variables,
            headers=headers,
            client=self,
        )


class ParametrizeArgs(TypedDict):
    argnames: list[str]
    argvalues: list[TNamedTuple]
    ids: list[str]


def parametrize_helper(__tests: dict[str, TNamedTuple], /) -> ParametrizeArgs:
    """Construct parametrize input while setting test IDs."""
    assert __tests, "I need some tests, please!"
    values = list(__tests.values())
    try:
        return ParametrizeArgs(
            argnames=list(values[0].__class__.__annotations__),
            argvalues=values,
            ids=list(__tests),
        )
    except Exception as error:  # noqa
        raise RuntimeError("Improper configuration. Did you use a NamedTuple for TNamedTuple?") from error


class PrintableDefaultDict(defaultdict):
    """Defaultdict that pretty-prints like a regular dict."""

    __str__ = dict.__str__
    __repr__ = dict.__repr__

    def json(self) -> str:
        return json.dumps(self, indent=2, sort_keys=True, default=str)


def _recursive_defaultdict() -> PrintableDefaultDict:
    return PrintableDefaultDict(_recursive_defaultdict)


def _recursive_object_hook(data: dict[str, Any] | None = None) -> PrintableDefaultDict:
    new_dict = _recursive_defaultdict()
    if data:
        new_dict.update(data)
    return new_dict


def load_content(string: str | bytes, /) -> PrintableDefaultDict:
    """Load GraphQL response contents to custom defaultdicts for easier content checking."""
    return json.loads(string, object_hook=_recursive_object_hook)
