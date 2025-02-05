from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationStatisticsReservationUnitManager",
    "ReservationStatisticsReservationUnitQuerySet",
]


class ReservationStatisticsReservationUnitQuerySet(models.QuerySet): ...


class ReservationStatisticsReservationUnitManager(
    models.Manager.from_queryset(ReservationStatisticsReservationUnitQuerySet),
): ...
