from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import OriginHaukiResource
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "OriginHaukiResourceManager",
    "OriginHaukiResourceQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=OriginHaukiResource, covariant=True, default=OriginHaukiResource)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=OriginHaukiResource)


class OriginHaukiResourceQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class OriginHaukiResourceManager(ModelManager[OriginHaukiResource, OriginHaukiResourceQuerySet]): ...
