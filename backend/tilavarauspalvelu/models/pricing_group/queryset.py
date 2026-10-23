from __future__ import annotations

from tilavarauspalvelu.models import PricingGroup
from tilavarauspalvelu.models._base import ModelManager, TranslatedModelQuerySet

__all__ = [
    "PricingGroupManager",
    "PricingGroupQuerySet",
]


class PricingGroupQuerySet(TranslatedModelQuerySet[PricingGroup]): ...


class PricingGroupManager(ModelManager[PricingGroup, PricingGroupQuerySet]): ...
