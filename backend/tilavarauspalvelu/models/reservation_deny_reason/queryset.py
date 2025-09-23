from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationDenyReasonManager",
    "ReservationDenyReasonQuerySet",
]


class ReservationDenyReasonQuerySet(models.QuerySet): ...


class ReservationDenyReasonManager(models.Manager.from_queryset(ReservationDenyReasonQuerySet)): ...
