from __future__ import annotations

from django.db import models

__all__ = [
    "TermsOfUseManager",
    "TermsOfUseQuerySet",
]


class TermsOfUseQuerySet(models.QuerySet): ...


class TermsOfUseManager(models.Manager.from_queryset(TermsOfUseQuerySet)): ...
