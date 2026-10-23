from __future__ import annotations

from tilavarauspalvelu.models import PriceComponent
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "PriceComponentManager",
    "PriceComponentQuerySet",
]


class PriceComponentQuerySet(ModelQuerySet[PriceComponent]): ...


class PriceComponentManager(ModelManager[PriceComponent, PriceComponentQuerySet]): ...
