from __future__ import annotations

from django.db import models

__all__ = [
    "UnitRoleManager",
    "UnitRoleQuerySet",
]


class UnitRoleQuerySet(models.QuerySet): ...


class UnitRoleManager(models.Manager.from_queryset(UnitRoleQuerySet)): ...
