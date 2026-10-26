from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import SalesItem
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "SalesItemManager",
    "SalesItemQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=SalesItem, covariant=True, default=SalesItem)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=SalesItem)


class SalesItemQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class SalesItemManager(ModelManager[SalesItem, SalesItemQuerySet]): ...
