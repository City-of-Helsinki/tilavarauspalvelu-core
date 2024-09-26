from __future__ import annotations

from django.db import models

__all__ = [
    "PersonQuerySet",
]


class PersonQuerySet(models.QuerySet): ...
