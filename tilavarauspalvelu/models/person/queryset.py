from __future__ import annotations

from django.db import models
from helsinki_gdpr.models import SerializableMixin

__all__ = [
    "PersonManager",
    "PersonQuerySet",
]


class PersonQuerySet(models.QuerySet): ...


class PersonManager(SerializableMixin.SerializableManager.from_queryset(PersonQuerySet)): ...
