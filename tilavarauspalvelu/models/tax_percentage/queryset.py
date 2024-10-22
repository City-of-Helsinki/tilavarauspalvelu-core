from __future__ import annotations

from django.db import models

__all__ = [
    "TaxPercentageManager",
    "TaxPercentageQuerySet",
]


class TaxPercentageQuerySet(models.QuerySet): ...


class TaxPercentageManager(models.Manager.from_queryset(TaxPercentageQuerySet)): ...
