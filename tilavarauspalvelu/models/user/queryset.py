from __future__ import annotations

import datetime

from django.conf import settings
from django.contrib.auth.models import UserManager as DjangoUserManager
from django.db import models

from utils.date_utils import local_date

__all__ = [
    "UserManager",
    "UserQuerySet",
]


class UserQuerySet(models.QuerySet):
    def remove_old_superuser_and_staff_permissions(self) -> None:
        today = local_date()
        cutoff = today - datetime.timedelta(days=settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS)

        self.filter(
            models.Q(is_active=True)
            & (
                models.Q(is_staff=True)  #
                | models.Q(is_superuser=True)
            )
            & models.Q(last_login__date__lt=cutoff)
        ).update(is_staff=False, is_superuser=False)

    def should_deactivate_permissions(self) -> models.QuerySet:
        """Which users' permissions should be deactivated due to inactivity."""
        cutoff = (
            local_date()
            + datetime.timedelta(days=settings.PERMISSION_NOTIFICATION_BEFORE_DAYS)
            - datetime.timedelta(days=settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS)
        )

        return self.filter(
            models.Q(is_active=True)
            & (
                models.Q(is_staff=True)
                | models.Q(is_superuser=True)
                | (
                    models.Q(general_roles__isnull=False)  #
                    & models.Q(general_roles__role_active=True)
                )
                | (
                    models.Q(unit_roles__isnull=False)  #
                    & models.Q(unit_roles__role_active=True)
                )
            )
            & models.Q(last_login__date__lt=cutoff)
        )


class UserManager(DjangoUserManager.from_queryset(UserQuerySet)): ...
