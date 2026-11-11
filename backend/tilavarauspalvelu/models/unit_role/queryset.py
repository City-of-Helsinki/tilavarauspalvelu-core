from __future__ import annotations

import datetime
from typing import TypeVar

from django.conf import settings

from tilavarauspalvelu.models import UnitRole
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet
from utils.date_utils import local_date
from utils.model_signals import update_with_signals

__all__ = [
    "UnitRoleManager",
    "UnitRoleQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=UnitRole, covariant=True, default=UnitRole)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=UnitRole)


class UnitRoleQuerySet(ModelQuerySet[_TModel_co, _TRow_co]):
    def deactivate_old_permissions(self) -> None:
        today = local_date()
        cutoff = today - datetime.timedelta(days=settings.PERMISSIONS_VALID_FROM_LAST_LOGIN_DAYS)

        old_roles = self.filter(
            is_role_active=True,
            user__is_active=True,
            user__last_login__date__lt=cutoff,
        )
        update_with_signals(old_roles, is_role_active=False)


class UnitRoleManager(ModelManager[UnitRole, UnitRoleQuerySet]): ...
