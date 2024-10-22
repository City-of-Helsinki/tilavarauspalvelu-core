from __future__ import annotations

from django.db import models
from helsinki_gdpr.models import SerializableMixin

__all__ = [
    "AddressManager",
    "AddressQuerySet",
]


class AddressQuerySet(models.QuerySet): ...


class AddressManager(SerializableMixin.SerializableManager.from_queryset(AddressQuerySet)): ...
