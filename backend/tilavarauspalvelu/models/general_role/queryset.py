from __future__ import annotations

import datetime

from django.conf import settings

from tilavarauspalvelu.models import GeneralRole
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_date

__all__ = [
    "GeneralRoleManager",
    "GeneralRoleQuerySet",
]


class GeneralRoleQuerySet(ModelQuerySet[GeneralRole]):
    def deactivate_old_permissions(self) -> None:
        today = local_date()
        cutoff = today - datetime.timedelta(days=settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS)

        self.filter(
            is_role_active=True,
            user__is_active=True,
            user__last_login__date__lt=cutoff,
        ).update(is_role_active=False)


class GeneralRoleManager(ModelManager[GeneralRole, GeneralRoleQuerySet]): ...
