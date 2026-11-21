from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import TaxPercentage
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "TaxPercentageManager",
    "TaxPercentageQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=TaxPercentage, covariant=True, default=TaxPercentage)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=TaxPercentage)


class TaxPercentageQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class TaxPercentageManager(ModelManager[TaxPercentage, TaxPercentageQuerySet]): ...
