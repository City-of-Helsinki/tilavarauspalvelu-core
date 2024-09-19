from __future__ import annotations

from django.db import models

__all__ = [
    "OriginHaukiResourceManager",
    "OriginHaukiResourceQuerySet",
]


class OriginHaukiResourceQuerySet(models.QuerySet): ...


class OriginHaukiResourceManager(models.Manager.from_queryset(OriginHaukiResourceQuerySet)): ...
