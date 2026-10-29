from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import AgeGroup
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "AgeGroupManager",
    "AgeGroupQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=AgeGroup, covariant=True, default=AgeGroup)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=AgeGroup)


class AgeGroupQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class AgeGroupManager(ModelManager[AgeGroup, AgeGroupQuerySet]): ...
