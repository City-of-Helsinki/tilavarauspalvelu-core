from __future__ import annotations

from django.db import models

__all__ = [
    "LocationManager",
    "LocationQuerySet",
]


class LocationQuerySet(models.QuerySet): ...


class LocationManager(models.Manager.from_queryset(LocationQuerySet)): ...
