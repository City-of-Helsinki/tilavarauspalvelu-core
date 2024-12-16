from __future__ import annotations

from django.db import models

__all__ = [
    "BugReportManager",
    "BugReportQuerySet",
]


class BugReportQuerySet(models.QuerySet): ...


class BugReportManager(models.Manager.from_queryset(BugReportQuerySet)): ...
