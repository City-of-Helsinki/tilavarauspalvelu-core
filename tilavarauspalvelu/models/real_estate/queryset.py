from __future__ import annotations

from django.db import models

__all__ = [
    "RealEstateManager",
    "RealEstateQuerySet",
]


class RealEstateQuerySet(models.QuerySet): ...


class RealEstateManager(models.Manager.from_queryset(RealEstateQuerySet)): ...
