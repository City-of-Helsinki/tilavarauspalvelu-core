from __future__ import annotations

import datetime

from django.conf import settings

from tilavarauspalvelu.models import UnitRole
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_date

__all__ = [
    "UnitRoleManager",
    "UnitRoleQuerySet",
]


class UnitRoleQuerySet(ModelQuerySet[UnitRole]):
    def deactivate_old_permissions(self) -> None:
        today = local_date()
        cutoff = today - datetime.timedelta(days=settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS)

        self.filter(
            is_role_active=True,
            user__is_active=True,
            user__last_login__date__lt=cutoff,
        ).update(is_role_active=False)


class UnitRoleManager(ModelManager[UnitRole, UnitRoleQuerySet]): ...
