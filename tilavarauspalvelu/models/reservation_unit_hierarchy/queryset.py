from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationUnitHierarchyManager",
    "ReservationUnitHierarchyQuerySet",
]


class ReservationUnitHierarchyQuerySet(models.QuerySet): ...


class ReservationUnitHierarchyManager(models.Manager.from_queryset(ReservationUnitHierarchyQuerySet)): ...
