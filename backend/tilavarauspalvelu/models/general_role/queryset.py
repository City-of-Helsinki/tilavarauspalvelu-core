from __future__ import annotations

import datetime
from typing import TypeVar

from django.conf import settings

from tilavarauspalvelu.models import GeneralRole
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_date

__all__ = [
    "GeneralRoleManager",
    "GeneralRoleQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=GeneralRole, covariant=True, default=GeneralRole)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=GeneralRole)


class GeneralRoleQuerySet(ModelQuerySet[_TModel_co, _TRow_co]):
    def deactivate_old_permissions(self) -> None:
        today = local_date()
        cutoff = today - datetime.timedelta(days=settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS)

        self.filter(
            is_role_active=True,
            user__is_active=True,
            user__last_login__date__lt=cutoff,
        ).update(is_role_active=False)


class GeneralRoleManager(ModelManager[GeneralRole, GeneralRoleQuerySet]): ...
