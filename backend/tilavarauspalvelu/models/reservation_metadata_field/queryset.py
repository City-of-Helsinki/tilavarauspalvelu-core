from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationMetadataFieldManager",
    "ReservationMetadataFieldQuerySet",
]


class ReservationMetadataFieldQuerySet(models.QuerySet): ...


class ReservationMetadataFieldManager(models.Manager.from_queryset(ReservationMetadataFieldQuerySet)): ...
