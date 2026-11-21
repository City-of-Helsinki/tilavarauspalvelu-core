from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import Resource
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "ResourceManager",
    "ResourceQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=Resource, covariant=True, default=Resource)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=Resource)


class ResourceQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class ResourceManager(TranslatedModelManager[Resource, ResourceQuerySet]): ...
