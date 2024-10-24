from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationUnitPricingManager",
    "ReservationUnitPricingQuerySet",
]


class ReservationUnitPricingQuerySet(models.QuerySet): ...


class ReservationUnitPricingManager(models.Manager.from_queryset(ReservationUnitPricingQuerySet)): ...
