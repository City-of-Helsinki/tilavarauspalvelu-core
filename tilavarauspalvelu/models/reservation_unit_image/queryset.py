from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationUnitImageManager",
    "ReservationUnitImageQuerySet",
]


class ReservationUnitImageQuerySet(models.QuerySet): ...


class ReservationUnitImageManager(models.Manager.from_queryset(ReservationUnitImageQuerySet)): ...
