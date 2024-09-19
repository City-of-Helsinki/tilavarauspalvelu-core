from __future__ import annotations

from django.db import models

__all__ = [
    "BuildingManager",
    "BuildingQuerySet",
]


class BuildingQuerySet(models.QuerySet): ...


class BuildingManager(models.Manager.from_queryset(BuildingQuerySet)): ...
