from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationUnitPaymentTypeManager",
    "ReservationUnitPaymentTypeQuerySet",
]


class ReservationUnitPaymentTypeQuerySet(models.QuerySet): ...


class ReservationUnitPaymentTypeManager(models.Manager.from_queryset(ReservationUnitPaymentTypeQuerySet)): ...
