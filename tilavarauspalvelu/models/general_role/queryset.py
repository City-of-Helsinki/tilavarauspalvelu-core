from __future__ import annotations

from django.db import models

__all__ = [
    "GeneralRoleManager",
    "GeneralRoleQuerySet",
]


class GeneralRoleQuerySet(models.QuerySet): ...


class GeneralRoleManager(models.Manager.from_queryset(GeneralRoleQuerySet)): ...
