from __future__ import annotations

from tilavarauspalvelu.models import Resource
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "ResourceManager",
    "ResourceQuerySet",
]


class ResourceQuerySet(TranslatedModelQuerySet[Resource]): ...


class ResourceManager(ModelManager[Resource, ResourceQuerySet]): ...
