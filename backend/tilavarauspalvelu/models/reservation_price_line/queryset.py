from __future__ import annotations

from typing import TypeVar

from tilavarauspalvelu.models import ReservationPriceLine
from tilavarauspalvelu.models._base import ModelManager, ModelQuerySet

__all__ = [
    "ReservationPriceLineManager",
    "ReservationPriceLineQuerySet",
]


_TModel_co = TypeVar("_TModel_co", bound=ReservationPriceLine, covariant=True, default=ReservationPriceLine)
_TRow_co = TypeVar("_TRow_co", covariant=True, default=ReservationPriceLine)


class ReservationPriceLineQuerySet(ModelQuerySet[_TModel_co, _TRow_co]): ...


class ReservationPriceLineManager(ModelManager[ReservationPriceLine, ReservationPriceLineQuerySet]): ...
