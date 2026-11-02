from __future__ import annotations

from tilavarauspalvelu.models import SalesItem
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "SalesItemManager",
    "SalesItemQuerySet",
]


class SalesItemQuerySet(ModelQuerySet[SalesItem]): ...


class SalesItemManager(ModelManager[SalesItem, SalesItemQuerySet]): ...
