from __future__ import annotations

from django.db import models

__all__ = [
    "EquipmentCategoryManager",
    "EquipmentCategoryQuerySet",
]


class EquipmentCategoryQuerySet(models.QuerySet): ...


class EquipmentCategoryManager(models.Manager.from_queryset(EquipmentCategoryQuerySet)): ...
