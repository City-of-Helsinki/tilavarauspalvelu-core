from __future__ import annotations

import datetime

from django.conf import settings
from django.db import models

from utils.date_utils import local_date

__all__ = [
    "GeneralRoleManager",
    "GeneralRoleQuerySet",
]


class GeneralRoleQuerySet(models.QuerySet):
    def deactivate_old_permissions(self) -> None:
        today = local_date()
        cutoff = today - datetime.timedelta(days=settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS)

        self.filter(
            role_active=True,
            user__is_active=True,
            user__last_login__date__lt=cutoff,
        ).update(role_active=False)


class GeneralRoleManager(models.Manager.from_queryset(GeneralRoleQuerySet)): ...
