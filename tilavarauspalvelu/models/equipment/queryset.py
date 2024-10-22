from __future__ import annotations

from django.db import models

__all__ = [
    "EquipmentManager",
    "EquipmentQuerySet",
]


class EquipmentQuerySet(models.QuerySet): ...


class EquipmentManager(models.Manager.from_queryset(EquipmentQuerySet)): ...
