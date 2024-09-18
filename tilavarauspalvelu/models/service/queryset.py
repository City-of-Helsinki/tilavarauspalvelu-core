from __future__ import annotations

from django.db import models

__all__ = [
    "ServiceQuerySet",
]


class ServiceQuerySet(models.QuerySet): ...


class ServiceManager(models.Manager.from_queryset(ServiceQuerySet)): ...
