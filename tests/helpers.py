import json
from collections.abc import Callable, Generator
from contextlib import contextmanager
from dataclasses import dataclass
from enum import Enum, auto
from functools import wraps
from typing import Any, NamedTuple, ParamSpec, Self, TypedDict, TypeVar
from unittest import mock

import pytest
import sqlparse
from django import db
from django.contrib.auth import get_user_model
from django.http import HttpResponse
from django.test import Client
from graphene.utils.str_converters import to_camel_case
from graphene_django.utils.testing import graphql_query

__all__ = [
    "build_mutation",
    "build_query",
    "capture_database_queries",
    "GraphQLClient",
    "parametrize_helper",
    "ResponseMock",
    "UserType",
]

TNamedTuple = TypeVar("TNamedTuple", bound=NamedTuple)

User = get_user_model()


class FieldError(TypedDict):
    field: str
    messages: list[str]


class UserType(Enum):
    ANONYMOUS = auto()
    REGULAR = auto()
    STAFF = auto()
    SUPERUSER = auto()
    NOTIFICATION_MANAGER = auto()


@dataclass
class QueryData:
    queries: list[str]

    @property
    def log(self) -> str:
        message = "-" * 75
        message += f"\n>>> Queries ({len(self.queries)}):\n"
        for index, query in enumerate(self.queries):
            message += f"{index + 1}) ".ljust(75, "-") + f"\n{query}\n"
        message += "-" * 75
        return message


class GQLResponse:
    def __init__(self, response: HttpResponse, query_data: QueryData) -> None:
        # 'django.test.client.Client.request' sets json attribute on the response.
        self.json: dict[str, Any] = response.json()  # type: ignore
        self.query_data = query_data

    def __str__(self) -> str:
        return json.dumps(self.json, indent=2, sort_keys=True, default=str)

    def __repr__(self) -> str:
        return repr(self.json)

    def __getitem__(self, item: str) -> dict[str, Any] | None:
        return (self.data or {})[item]

    def __contains__(self, item: str) -> bool:
        return item not in self.json

    @property
    def queries(self) -> list[str]:
        """Return a list of the database queries that were executed."""
        return self.query_data.queries

    @property
    def query_log(self) -> str:
        """Return a string representation of the database queries that were executed."""
        return self.query_data.log

    @property
    def data(self) -> dict[str, Any] | None:
        """Return the data from the response content."""
        return self.json["data"]

    @property
    def first_query_object(self) -> dict[str, Any] | None:
        """
        Return the first query object in the response content.

        >>> self.json = {"data": {"foo": {"name": "bar"}}}
        >>> self.first_query_object
        {"name": "bar"}
        """
        data = self.data or {}
        try:
            return next(iter(data.values()))
        except StopIteration:
            pytest.fail(f"No query object not found in response content: {self.json}")

    @property
    def edges(self) -> list[dict[str, Any]]:
        """
        Return edges from the first query in the response content.

        >>> self.json = {"data": {"foo": {"edges": [{"node": {"name": "bar"}}]}}}
        >>> self.edges
        [{"node": {"name": "bar"}}]
        """
        try:
            return self.first_query_object["edges"]
        except (KeyError, TypeError):
            pytest.fail(f"Edges not found in response content: {self.json}")

    def node(self, index: int = 0) -> dict[str, Any]:
        """
        Return the node at the given index in the response content edges.

        >>> self.json = {"data": {"foo": {"edges": [{"node": {"name": "bar"}}]}}}
        >>> self.node(0)
        {"name": "bar"}
        """
        try:
            return self.edges[index]["node"]
        except (IndexError, TypeError):
            pytest.fail(f"Node {index!r} not found in response content: {self.json}")

    @property
    def has_errors(self) -> bool:
        """Are there any errors in the response?"""
        # Errors in the root of the response
        if "errors" in self.json and self.json.get("errors") is not None:
            return True

        # Errors in the fields of the first query object
        if "errors" in (self.first_query_object or {}) and (self.first_query_object or {}).get("errors") is not None:
            return True

        return False

    @property
    def errors(self) -> list[dict[str, Any]]:
        """
        Return errors found in the root of the response.

        >>> self.json = {"errors": [{"locations": [...], "message": "bar", "path": [...]}]}
        >>> self.errors
        [{"locations": [...], "message": "bar", "path": [...]}]
        """
        try:
            return self.json["errors"]
        except (KeyError, TypeError):
            pytest.fail(f"Errors not found in response content: {self.json}")

    def error_message(self, selector: int | str = 0) -> str:
        """
        Return the error message from the errors list...

        1) in the given index

        >>> self.json = {"errors": [{"message": ["bar"], "path": [...]}]}
        >>> self.error_message(0)  # default
        "bar"

        2) in the given path:

        >>> self.json = {"errors": [{"message": ["bar"], "path": ["fizz", "buzz", "foo"]}]}
        >>> self.error_message("foo")
        "bar"
        """
        if isinstance(selector, int):
            try:
                return self.errors[selector]["message"]
            except IndexError:
                pytest.fail(f"Errors list doesn't have an index {selector}: {self.json}")
            except (KeyError, TypeError):
                pytest.fail(f"Field 'message' not found in error content: {self.json}")
        else:
            try:
                return next(error["message"] for error in self.errors if error["path"][-1] == selector)
            except StopIteration:
                pytest.fail(f"Errors list doesn't have an error for field '{selector}': {self.json}")
            except (KeyError, TypeError):
                pytest.fail(f"Field 'message' not found in error content: {self.json}")

    @property
    def field_errors(self) -> list[FieldError]:
        """
        Return errors for data fields.

        >>> self.json = {"data": {"foo": {"errors": [{"field": "bar", "message": ["baz"]}]
        >>> self.field_errors
        [{"field": "bar", "message": ["baz"]}]
        """
        try:
            return self.first_query_object["errors"]
        except (KeyError, TypeError):
            pytest.fail(f"Field errors not found in response content: {self.json}")

    def field_error_messages(self, field: str = "nonFieldErrors") -> list[str]:
        """
        Return field error messages for desired field.

        >>> self.json = {"errors": [{"field": "foo", "message": ["bar"]}]}
        >>> self.field_error_messages("foo")
        ["bar"]
        """
        for error in self.field_errors or []:
            if error.get("field") == field:
                try:
                    return error["messages"]
                except (KeyError, TypeError):
                    pytest.fail(f"Error message for field {field!r} not found in error: {error}")
        raise pytest.fail(f"Error for field {field!r} not found in response content: {self.json}")

    def assert_query_count(self, count: int) -> None:
        assert len(self.queries) == count, self.query_log


class GraphQLClient(Client):
    def __call__(
        self: Self,
        query: str,
        operation_name: str | None = None,
        input_data: dict[str, Any] | None = None,
        variables: dict[str, Any] | None = None,
        headers: dict[str, Any] | None = None,
    ) -> GQLResponse:
        """
        Make a GraphQL query to the test client.

        :params query: GraphQL query string.
        :params operation_name: Name of the operation to execute.
        :params input_data: Set (and override) the "input" variable in the given variables.
        :params variables: Variables for the query.
        :params headers: Headers for the query. Keys should in all-caps, and be prepended with "HTTP_".
        """
        with capture_database_queries() as results:
            response = graphql_query(
                query=query,
                operation_name=operation_name,
                input_data=input_data,
                variables=variables,
                headers=headers,
                client=self,
            )
        return GQLResponse(response, results)

    def login_user_based_on_type(self, user_type: UserType) -> User | None:
        """Login user specific type of user in the client."""
        from .factories import UserFactory

        user: User | None = None

        match user_type:
            case UserType.ANONYMOUS:
                self.logout()
            case UserType.REGULAR:
                user = UserFactory.create()
            case UserType.STAFF:
                user = UserFactory.create_staff_user()
            case UserType.SUPERUSER:
                user = UserFactory.create_superuser()
            case UserType.NOTIFICATION_MANAGER:
                user = UserFactory.create_with_general_permissions(perms=["can_manage_notifications"])
            case _:
                raise ValueError(f"Unknown user type: {user_type}")

        if user is not None:
            self.force_login(user)

        return user


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
    except Exception as error:
        raise RuntimeError("Improper configuration. Did you use a NamedTuple for TNamedTuple?") from error


class ResponseMock:
    def __init__(self, json_data: dict[str, Any], status_code: int = 200) -> None:
        self.json_data = json_data
        self.status_code = status_code

    def json(self) -> dict[str, Any]:
        return self.json_data


def _format_for_query(value: Any) -> str:
    if isinstance(value, Enum):
        return value.value
    if isinstance(value, list) and all(isinstance(item, Enum) for item in value):
        return f"[{', '.join(str(item.value) for item in value)}]"
    return json.dumps(value)


def _build_query_definition(query_def: str, /, **filter_params: Any) -> str:
    if filter_params:
        data = (f"{to_camel_case(key)}: {_format_for_query(value)}" for key, value in filter_params.items())
        query_def += f"({', '.join(data)})"
    return query_def


def build_query(__name: str, *, fields: str = "pk", connection: bool = False, **filter_params: Any) -> str:
    """
    Build a GraphQL query with the given field selections and filter parameters.

    :param __name: Name of the QueryObject the query is for, e.g., `applicationEvents`.
    :param fields: Field selections as a GraphQL string.
    :param connection: Whether to build a Relay connection query or basic one.
    :param filter_params: Parameters to use in the query. Will be converted to camelCase.
    """
    query_def = _build_query_definition(__name, **filter_params)
    if connection:
        fields = f"edges {{ node {{ {fields} }} }}"
    return f"query {{ {query_def} {{ {fields} }} }}"


def build_mutation(name: str, input_name: str, selections: str = "pk errors { messages field }") -> str:
    """
    Build a GraphqQL mutation with the given field selections.

    :param name: Name of the QueryObject the mutation is for, e.g., `createApplicationEvent`.
    :param input_name: Name of the mutation input object, e.g., `ApplicationEventCreateMutationInput`.
    :param selections: Field selections as a GraphQL string.
    """
    return f"mutation {name}($input: {input_name}!) {{ {name}(input: $input) {{ {selections} }} }}"


@contextmanager
def capture_database_queries() -> Generator[QueryData, None, None]:
    """Capture results of what database queries were executed."""
    results = QueryData(queries=[])
    db.connection.queries_log.clear()

    try:
        yield results
    finally:
        results.queries = [
            sqlparse.format(query["sql"], reindent=True)
            for query in db.connection.queries
            if "sql" in query
            and not query["sql"].startswith("SAVEPOINT")
            and not query["sql"].startswith("RELEASE SAVEPOINT")
        ]


T = TypeVar("T")
P = ParamSpec("P")


def patch_method(
    method: Callable,
    return_value: Any = None,
    side_effect: Any = None,
) -> Callable[[Callable[P, T]], Callable[P, T]]:
    """
    Patch a method inside a class.

    Used in place of 'mock.patch' to have the 'method' argument as a function instead of a string.
    e.g.
        @patch_method(MyClass.my_method, return_value=...)
        def test_something(...):
            ...

    Does not work on functions declared outside of classes.
    """

    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def wrapper(*args: P.args, **kwargs: P.kwargs) -> T:
            # Get the full path to the method, e.g., 'module.submodule.Class.method'
            method_path = method.__module__ + "." + method.__qualname__  # type: ignore

            # Run the test with the method patched
            with mock.patch(method_path, return_value=return_value, side_effect=side_effect):
                return func(*args, **kwargs)

        return wrapper

    return decorator
