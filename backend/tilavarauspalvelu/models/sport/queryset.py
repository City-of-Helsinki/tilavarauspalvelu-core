from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import Sport
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "SportManager",
    "SportQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=Sport, covariant=True, default=Sport)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=Sport)


class SportQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class SportManager(ModelManager[Sport, SportQuerySet]): ...
