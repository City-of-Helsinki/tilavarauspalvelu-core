from collections.abc import Callable
from enum import Enum, auto
from functools import wraps
from typing import Any, NamedTuple, ParamSpec, TypeVar
from unittest import mock

from django.contrib.auth import get_user_model
from graphene_django_extensions.testing import GraphQLClient as BaseGraphQLClient

__all__ = [
    "GraphQLClient",
    "ResponseMock",
    "UserType",
]

TNamedTuple = TypeVar("TNamedTuple", bound=NamedTuple)

User = get_user_model()


class UserType(Enum):
    ANONYMOUS = auto()
    REGULAR = auto()
    STAFF = auto()
    SUPERUSER = auto()
    NOTIFICATION_MANAGER = auto()


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
