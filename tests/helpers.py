from collections.abc import Callable
from enum import Enum, auto
from functools import wraps
from typing import Any, NamedTuple, ParamSpec, TypedDict, TypeVar
from unittest import mock

import pytest
from django.contrib.auth import get_user_model
from graphene_django_extensions.testing import GraphQLClient as BaseGraphQLClient

__all__ = [
    "GraphQLClient",
    "parametrize_helper",
    "ResponseMock",
    "UserType",
]

from graphene_django_extensions.testing.client import GQLResponse

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


def deprecated_field_error_messages(response: GQLResponse, field: str = "nonFieldErrors") -> list[str]:
    # Support for old-style error messages in the GraphQL "data" layer:
    # {
    #    "data": {
    #        "errors": ...  <-- Here
    #    },
    #    "errors": ...,  <-- Not here
    # }
    try:
        data = response.first_query_object["errors"]
    except (KeyError, TypeError):
        pytest.fail(f"Field errors not found in response content: {response.json}")

    for error in data or []:
        if error.get("field") == field:
            try:
                return error["messages"]
            except (KeyError, TypeError):
                pytest.fail(f"Error message for field {field!r} not found in error: {error}")
    raise pytest.fail(f"Error for field {field!r} not found in response content: {response.json}")


def assert_query_count(self, count: int) -> None:
    assert len(self.queries) == count, self.query_log


class GraphQLClient(BaseGraphQLClient):
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
