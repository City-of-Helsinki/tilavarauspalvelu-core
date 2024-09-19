from __future__ import annotations

from django.db import models

__all__ = [
    "EmailTemplateManager",
    "EmailTemplateQuerySet",
]


class EmailTemplateQuerySet(models.QuerySet): ...


class EmailTemplateManager(models.Manager.from_queryset(EmailTemplateQuerySet)): ...
