from __future__ import annotations

from django.db import models

__all__ = [
    "ServiceSectorManager",
    "ServiceSectorQuerySet",
]


class ServiceSectorQuerySet(models.QuerySet): ...


class ServiceSectorManager(models.Manager.from_queryset(ServiceSectorQuerySet)): ...
