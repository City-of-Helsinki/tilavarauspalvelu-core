from graphene_permissions.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

from permissions.helpers import can_view_recurring_reservation, can_view_reservation


def reservation_non_public_field(func: callable):
    def permission_check(*args, **kwargs):
        if can_view_reservation(args[1].context.user, args[0]):
            return func(*args, **kwargs)

        return None

    return permission_check


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
