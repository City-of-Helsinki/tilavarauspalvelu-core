from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationUnitCancellationRuleManager",
    "ReservationUnitCancellationRuleQuerySet",
]


class ReservationUnitCancellationRuleQuerySet(models.QuerySet): ...


class ReservationUnitCancellationRuleManager(models.Manager.from_queryset(ReservationUnitCancellationRuleQuerySet)): ...
