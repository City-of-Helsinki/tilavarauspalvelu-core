from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import PriceComponent
from tilavarauspalvelu.models._base import ModelQuerySet, TranslatedModelManager

__all__ = [
    "PriceComponentManager",
    "PriceComponentQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=PriceComponent, covariant=True, default=PriceComponent)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=PriceComponent)


class PriceComponentQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class PriceComponentManager(TranslatedModelManager[PriceComponent, PriceComponentQuerySet]): ...
