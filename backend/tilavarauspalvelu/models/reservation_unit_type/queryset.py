from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationUnitTypeManager",
    "ReservationUnitTypeQuerySet",
]


class ReservationUnitTypeQuerySet(models.QuerySet): ...


class ReservationUnitTypeManager(models.Manager.from_queryset(ReservationUnitTypeQuerySet)): ...
