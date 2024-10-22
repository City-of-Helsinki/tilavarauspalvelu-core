from __future__ import annotations

from django.db import models

__all__ = [
    "AbilityGroupManager",
    "AbilityGroupQuerySet",
]


class AbilityGroupQuerySet(models.QuerySet): ...


class AbilityGroupManager(models.Manager.from_queryset(AbilityGroupQuerySet)): ...
