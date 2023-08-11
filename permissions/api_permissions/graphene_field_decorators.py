from functools import wraps
from typing import Any, Callable, ParamSpec, TypeVar

from graphene_permissions.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

from permissions.helpers import can_view_recurring_reservation, can_view_reservation

T = TypeVar("T")
P = ParamSpec("P")
Decorator = Callable[[Callable[P, T]], Callable[P, T]] | Callable[P, T]


def reservation_non_public_field(func: callable):
    def permission_check(*args, **kwargs):
        if can_view_reservation(args[1].context.user, args[0]):
            return func(*args, **kwargs)

        return None

    return permission_check


def reservation_staff_field(default: Any = None) -> Decorator:
    def decorator(func: Callable[P, T]) -> Callable[P, T]:
        @wraps(func)
        def permission_check(*args: P.args, **kwargs: P.kwargs) -> T:
            if can_view_reservation(
                args[1].context.user, args[0], needs_staff_permissions=True
            ):
                return func(*args, **kwargs)

            return default

        return permission_check

    # If used without parentheses: '@reservation_staff_field'
    if callable(default):
        f = decorator(default)
        default = None
        return f

    return decorator


def recurring_reservation_non_public_field(func: callable):
    def permission_check(*args, **kwargs):
        if can_view_recurring_reservation(args[1].context.user, args[0]):
            return func(*args, **kwargs)

        return None

    return permission_check


def check_resolver_permission(
    permission_class: BasePermission, raise_permission_error=False
):
    def inner(func):
        def permission_check(*args, **kwargs):
            if permission_class.has_permission(args[1]):
                return func(*args, **kwargs)

            if raise_permission_error:
                raise PermissionDenied("No permissions to this operation.")
            return None

        return permission_check

    return inner
