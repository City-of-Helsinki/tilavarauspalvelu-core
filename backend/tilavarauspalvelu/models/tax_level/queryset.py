from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import TaxLevel
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "TaxLevelManager",
    "TaxLevelQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=TaxLevel, covariant=True, default=TaxLevel)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=TaxLevel)


class TaxLevelQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class TaxLevelManager(ModelManager[TaxLevel, TaxLevelQuerySet]): ...
