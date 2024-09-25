from __future__ import annotations

from django.db import models

__all__ = [
    "QualifierQuerySet",
]


class QualifierQuerySet(models.QuerySet): ...
