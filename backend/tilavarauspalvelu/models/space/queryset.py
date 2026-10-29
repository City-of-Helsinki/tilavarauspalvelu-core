from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import Space
from tilavarauspalvelu.models._base import ModelTreeQuerySet, TranslatedModelTreeManager

__all__ = [
    "SpaceManager",
    "SpaceQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=Space, covariant=True, default=Space)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=Space)


class SpaceQuerySet(ModelTreeQuerySet[_TModel_co, _TRow_co]): ...


class SpaceManager(TranslatedModelTreeManager[Space, SpaceQuerySet]): ...
