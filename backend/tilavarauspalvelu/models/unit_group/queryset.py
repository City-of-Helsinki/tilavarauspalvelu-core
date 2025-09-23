from __future__ import annotations

from django.db import models

__all__ = [
    "UnitGroupManager",
    "UnitGroupQuerySet",
]


class UnitGroupQuerySet(models.QuerySet): ...


class UnitGroupManager(models.Manager.from_queryset(UnitGroupQuerySet)): ...
