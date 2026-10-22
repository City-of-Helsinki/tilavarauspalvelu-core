from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitPricingGroup
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitPricingGroupManager",
    "ReservationUnitPricingGroupQuerySet",
]


class ReservationUnitPricingGroupQuerySet(ModelQuerySet[ReservationUnitPricingGroup]): ...


class ReservationUnitPricingGroupManager(
    ModelManager[ReservationUnitPricingGroup, ReservationUnitPricingGroupQuerySet],
): ...
