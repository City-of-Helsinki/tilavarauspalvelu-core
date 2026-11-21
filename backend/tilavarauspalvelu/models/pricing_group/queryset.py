from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import PricingGroup
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "PricingGroupManager",
    "PricingGroupQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=PricingGroup, covariant=True, default=PricingGroup)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=PricingGroup)


class PricingGroupQuerySet(TranslatedModelQuerySet[_TModel_co, _TRow_co]): ...


class PricingGroupManager(ModelManager[PricingGroup, PricingGroupQuerySet]): ...
