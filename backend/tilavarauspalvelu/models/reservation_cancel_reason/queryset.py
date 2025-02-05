from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationCancelReasonManager",
    "ReservationCancelReasonQuerySet",
]


class ReservationCancelReasonQuerySet(models.QuerySet): ...


class ReservationCancelReasonManager(models.Manager.from_queryset(ReservationCancelReasonQuerySet)): ...
