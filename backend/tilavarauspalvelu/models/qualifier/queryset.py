from __future__ import annotations

from django.db import models

__all__ = [
    "QualifierManager",
    "QualifierQuerySet",
]


class QualifierQuerySet(models.QuerySet): ...


class QualifierManager(models.Manager.from_queryset(QualifierQuerySet)): ...
