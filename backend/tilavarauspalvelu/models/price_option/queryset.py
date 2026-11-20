from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import PriceOption
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "PriceOptionManager",
    "PriceOptionQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=PriceOption, covariant=True, default=PriceOption)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=PriceOption)


class PriceOptionQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class PriceOptionManager(TranslatedModelManager[PriceOption, PriceOptionQuerySet]): ...
