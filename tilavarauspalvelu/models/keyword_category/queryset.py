from __future__ import annotations

from django.db import models

__all__ = [
    "KeywordCategoryManager",
    "KeywordCategoryQuerySet",
]


class KeywordCategoryQuerySet(models.QuerySet): ...


class KeywordCategoryManager(models.Manager.from_queryset(KeywordCategoryQuerySet)): ...
