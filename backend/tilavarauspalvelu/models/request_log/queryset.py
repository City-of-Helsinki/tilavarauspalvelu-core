from __future__ import annotations

from django.db import models

__all__ = [
    "RequestLogManager",
    "RequestLogQuerySet",
]


class RequestLogQuerySet(models.QuerySet): ...


class RequestLogManager(models.Manager.from_queryset(RequestLogQuerySet)): ...
