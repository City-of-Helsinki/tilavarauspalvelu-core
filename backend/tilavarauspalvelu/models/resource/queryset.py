from __future__ import annotations

from tilavarauspalvelu.models import Resource
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ResourceManager",
    "ResourceQuerySet",
]


class ResourceQuerySet(ModelQuerySet[Resource]): ...


class ResourceManager(ModelManager[Resource, ResourceQuerySet]): ...
