from django.db import models

from common.typing import AnyUser
from permissions.helpers import has_general_permission

__all__ = [
    "get_service_sectors_with_permission",
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
    service_sector_ids = [pk for pk, perms in user.service_sector_permissions.items() if permission in perms]

    return (
        Unit.objects.filter(
            models.Q(id__in=unit_ids)
            | models.Q(unit_groups__in=unit_group_ids)
            | models.Q(service_sectors__in=service_sector_ids)
        )
        .distinct()
        .values("pk")
    )


def get_service_sectors_with_permission(user: AnyUser, *, permission: str) -> models.QuerySet:
    """Given a permission, returns service sectors that the user has permission to"""
    from spaces.models import ServiceSector

    if user.is_anonymous:
        return ServiceSector.objects.none().values("pk")
    if user.is_superuser:
        return ServiceSector.objects.all().values("pk")
    if has_general_permission(user, permission):
        return ServiceSector.objects.all().values("pk")

    service_sector_ids = [pk for pk, perms in user.service_sector_permissions.items() if permission in perms]

    return ServiceSector.objects.filter(models.Q(id__in=service_sector_ids)).values("pk")
