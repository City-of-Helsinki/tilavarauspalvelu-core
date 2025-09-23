from __future__ import annotations

from django.db import models

__all__ = [
    "ResourceManager",
    "ResourceQuerySet",
]


class ResourceQuerySet(models.QuerySet): ...


class ResourceManager(models.Manager.from_queryset(ResourceQuerySet)): ...
