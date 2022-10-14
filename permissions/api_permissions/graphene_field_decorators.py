from django.conf import settings
from graphene_permissions.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

from permissions.helpers import can_view_recurring_reservation, can_view_reservation


def reservation_non_public_field(func: callable):
    def permission_check(*args, **kwargs):
        if not settings.TMP_PERMISSIONS_DISABLED and not can_view_reservation(
            args[1].context.user, args[0]
        ):
            return None

        return func(*args, **kwargs)

    return permission_check


def recurring_reservation_non_public_field(func: callable):
    def permission_check(*args, **kwargs):
        if (
            not settings.TMP_PERMISSIONS_DISABLED
            and not can_view_recurring_reservation(args[1].context.user, args[0])
        ):
            return None

        return func(*args, **kwargs)

    return permission_check


def check_resolver_permission(
    permission_class: BasePermission, raise_permission_error=False
):
    def inner(func):
        def permission_check(*args, **kwargs):
            if (
                not settings.TMP_PERMISSIONS_DISABLED
                and not permission_class.has_permission(args[1])
            ):
                if raise_permission_error:
                    raise PermissionDenied("No permissions to this operation.")

                return None

            return func(*args, **kwargs)

        return permission_check

    return inner
