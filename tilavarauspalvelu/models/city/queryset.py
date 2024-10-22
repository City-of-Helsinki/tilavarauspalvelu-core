from __future__ import annotations

from django.db import models

__all__ = [
    "CityManager",
    "CityQuerySet",
]


class CityQuerySet(models.QuerySet): ...


class CityManager(models.Manager.from_queryset(CityQuerySet)): ...
