from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationUnitOptionManager",
    "ReservationUnitOptionQuerySet",
]


class ReservationUnitOptionQuerySet(models.QuerySet): ...


class ReservationUnitOptionManager(models.Manager.from_queryset(ReservationUnitOptionQuerySet)): ...
