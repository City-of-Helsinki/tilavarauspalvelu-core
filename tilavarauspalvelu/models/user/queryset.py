from __future__ import annotations

from django.contrib.auth.models import UserManager as DjangoUserManager
from django.db import models

__all__ = [
    "UserManager",
    "UserQuerySet",
]


class UserQuerySet(models.QuerySet): ...


class UserManager(DjangoUserManager.from_queryset(UserQuerySet)): ...
