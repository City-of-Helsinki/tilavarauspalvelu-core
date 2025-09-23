from __future__ import annotations

from django.db import models

__all__ = [
    "ReservationMetadataSetManager",
    "ReservationMetadataSetQuerySet",
]


class ReservationMetadataSetQuerySet(models.QuerySet): ...


class ReservationMetadataSetManager(models.Manager.from_queryset(ReservationMetadataSetQuerySet)): ...
