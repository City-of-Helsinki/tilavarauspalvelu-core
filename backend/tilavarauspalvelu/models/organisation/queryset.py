from __future__ import annotations

from django.db import models
from helsinki_gdpr.models import SerializableMixin

__all__ = [
    "OrganisationManager",
    "OrganisationQuerySet",
]


class OrganisationQuerySet(models.QuerySet): ...


class OrganisationManager(SerializableMixin.SerializableManager.from_queryset(OrganisationQuerySet)): ...
