from __future__ import annotations

from django.db import models

__all__ = [
    "AgeGroupManager",
    "AgeGroupQuerySet",
]


class AgeGroupQuerySet(models.QuerySet): ...


class AgeGroupManager(models.Manager.from_queryset(AgeGroupQuerySet)): ...
