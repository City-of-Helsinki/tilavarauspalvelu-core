from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationPurposeManager",
    "ReservationPurposeQuerySet",
]


class ReservationPurposeQuerySet(models.QuerySet): ...


class ReservationPurposeManager(models.Manager.from_queryset(ReservationPurposeQuerySet)): ...
