from __future__ import annotations

from django.db import models

__all__ = [
    "KeywordManager",
    "KeywordQuerySet",
]


class KeywordQuerySet(models.QuerySet): ...


class KeywordManager(models.Manager.from_queryset(KeywordQuerySet)): ...
