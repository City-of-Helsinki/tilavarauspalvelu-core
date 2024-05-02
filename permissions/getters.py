from django.db import models

from common.typing import AnyUser
from permissions.helpers import has_general_permission

__all__ = [
    "get_units_with_permission",
]


def get_units_with_permission(user: AnyUser, *, permission: str) -> models.QuerySet:
    """Given a permission, returns units that the user has permissions to on different levels"""
    from spaces.models import Unit

    if user.is_anonymous:
        return Unit.objects.none().values("pk")
    if user.is_superuser:
        return Unit.objects.all().values("pk")
    if has_general_permission(user, permission):
        return Unit.objects.all().values("pk")

    unit_ids = [pk for pk, perms in user.unit_permissions.items() if permission in perms]
    unit_group_ids = [pk for pk, perms in user.unit_group_permissions.items() if permission in perms]

    return (
        Unit.objects.filter(models.Q(id__in=unit_ids) | models.Q(unit_groups__in=unit_group_ids))
        .distinct()
        .values("pk")
    )
