from __future__ import annotations

from django.db import models

__all__ = [
    "ApplicationRoundTimeSlotManager",
    "ApplicationRoundTimeSlotQuerySet",
]


class ApplicationRoundTimeSlotQuerySet(models.QuerySet): ...


class ApplicationRoundTimeSlotManager(models.Manager.from_queryset(ApplicationRoundTimeSlotQuerySet)): ...
