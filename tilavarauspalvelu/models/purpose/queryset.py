from __future__ import annotations

from django.db import models

__all__ = [
    "PurposeManager",
    "PurposeQuerySet",
]


class PurposeQuerySet(models.QuerySet): ...


class PurposeManager(models.Manager.from_queryset(PurposeQuerySet)): ...
