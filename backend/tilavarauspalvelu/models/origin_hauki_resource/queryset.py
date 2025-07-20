from __future__ import annotations

from tilavarauspalvelu.models import OriginHaukiResource
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "OriginHaukiResourceManager",
    "OriginHaukiResourceQuerySet",
]


class OriginHaukiResourceQuerySet(ModelQuerySet[OriginHaukiResource]): ...


class OriginHaukiResourceManager(ModelManager[OriginHaukiResource, OriginHaukiResourceQuerySet]): ...
