from __future__ import annotations

from django.db import models

__all__ = [
    "AffectingTimeSpanManager",
    "AffectingTimeSpanQuerySet",
]


class AffectingTimeSpanQuerySet(models.QuerySet): ...


class AffectingTimeSpanManager(models.Manager.from_queryset(AffectingTimeSpanQuerySet)): ...
