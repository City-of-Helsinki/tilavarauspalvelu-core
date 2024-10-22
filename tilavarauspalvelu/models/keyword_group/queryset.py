from __future__ import annotations

from django.db import models

__all__ = [
    "KeywordGroupManager",
    "KeywordGroupQuerySet",
]


class KeywordGroupQuerySet(models.QuerySet): ...


class KeywordGroupManager(models.Manager.from_queryset(KeywordGroupQuerySet)): ...
