from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationStatisticManager",
    "ReservationStatisticQuerySet",
]


class ReservationStatisticQuerySet(models.QuerySet): ...


class ReservationStatisticManager(models.Manager.from_queryset(ReservationStatisticQuerySet)): ...
