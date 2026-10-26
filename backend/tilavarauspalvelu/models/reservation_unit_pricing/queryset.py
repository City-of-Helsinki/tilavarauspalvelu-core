from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ReservationUnitPricing
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationUnitPricingManager",
    "ReservationUnitPricingQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ReservationUnitPricing, covariant=True, default=ReservationUnitPricing)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ReservationUnitPricing)


class ReservationUnitPricingQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class ReservationUnitPricingManager(ModelManager[ReservationUnitPricing, ReservationUnitPricingQuerySet]): ...
