from __future__ import annotations

from tilavarauspalvelu.models import ReservationUnitPricing
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitPricingManager",
    "ReservationUnitPricingQuerySet",
]


class ReservationUnitPricingQuerySet(ModelQuerySet[ReservationUnitPricing]): ...


class ReservationUnitPricingManager(ModelManager[ReservationUnitPricing, ReservationUnitPricingQuerySet]): ...
