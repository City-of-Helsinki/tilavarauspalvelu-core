from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import IntendedUse
from tilavarauspalvelu.models._base import TranslatedModelManager, TranslatedModelQuerySet

__all__ = [
    "IntendedUseManager",
    "IntendedUseQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=IntendedUse, covariant=True, default=IntendedUse)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=IntendedUse)


class IntendedUseQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class IntendedUseManager(TranslatedModelManager[IntendedUse, IntendedUseQuerySet]): ...
